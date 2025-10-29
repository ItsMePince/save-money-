package my_financial_app.demo.Controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import my_financial_app.demo.Entity.Account;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.AccountRepository;
import my_financial_app.demo.Repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(
        origins = {"http://localhost:3000","http://localhost:5173"},
        allowCredentials = "true"
)
public class AccountController {

    private final AccountRepository repo;
    private final UserRepository userRepo;

    public AccountController(AccountRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateAccountRequest req, HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");

        Account a = new Account();
        a.setUser(owner);
        a.setName(req.name.trim());
        a.setType(parseType(req.type));
        a.setAmount(BigDecimal.valueOf(req.amount));
        a.setIconKey(req.iconKey);

        return ResponseEntity.ok(repo.save(a));
    }

    @GetMapping
    public ResponseEntity<?> listMine(HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");
        List<Account> result = repo.findByUserIdOrderByIdDesc(owner.getId());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOne(@PathVariable Long id,
                                       @Valid @RequestBody CreateAccountRequest req,
                                       HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");

        Optional<Account> opt = repo.findByIdAndUserId(id, owner.getId());
        if (opt.isEmpty()) return ResponseEntity.status(404).body("Not found");

        Account a = opt.get();
        a.setName(req.name.trim());
        a.setType(parseType(req.type));
        a.setAmount(BigDecimal.valueOf(req.amount));
        a.setIconKey(req.iconKey);

        return ResponseEntity.ok(repo.save(a));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOne(@PathVariable Long id, HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");

        Optional<Account> opt = repo.findByIdAndUserId(id, owner.getId());
        if (opt.isEmpty()) return ResponseEntity.status(404).body("Not found");

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private User requireLoginUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        String username = (session != null) ? (String) session.getAttribute("username") : null;
        if (username == null || username.isBlank()) return null;
        return userRepo.findByUsername(username).orElse(null);
    }

    private static Account.AccountType parseType(String raw) {
        if (raw == null) return Account.AccountType.CASH;
        String s = raw.trim().toLowerCase(Locale.ROOT);
        if (s.equals("เงินสด") || s.equals("cash")) return Account.AccountType.CASH;
        if (s.equals("ธนาคาร") || s.equals("bank")) return Account.AccountType.BANK;
        if (s.equals("บัตรเครดิต") || s.equals("credit") || s.equals("credit_card") || s.equals("creditcard"))
            return Account.AccountType.CREDIT_CARD;
        return Account.AccountType.CASH;
    }
}
