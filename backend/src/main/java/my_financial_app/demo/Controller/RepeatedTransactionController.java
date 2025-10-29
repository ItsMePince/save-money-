package my_financial_app.demo.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import my_financial_app.demo.Entity.RepeatedTransaction;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.RepeatedTransactionRepository;
import my_financial_app.demo.Repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/repeated-transactions")
@CrossOrigin(
        origins = {"http://localhost:3000","http://localhost:5173"}, // Port ของ Frontend
        allowCredentials = "true"
)
public class RepeatedTransactionController {

    private final RepeatedTransactionRepository repo;
    private final UserRepository userRepo;

    public RepeatedTransactionController(RepeatedTransactionRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    // (Helper) ดึง User ที่ Login อยู่
    private User requireLoginUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        String username = (session != null) ? (String) session.getAttribute("username") : null;
        if (username == null || username.isBlank()) return null;
        return userRepo.findByUsername(username).orElse(null);
    }

    // GET /api/repeated-transactions
    @GetMapping
    public ResponseEntity<?> listMine(HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");

        List<RepeatedTransaction> result = repo.findByUserId(owner.getId());
        return ResponseEntity.ok(result);
    }

    // POST /api/repeated-transactions
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody RepeatedTransactionRequest req,
            HttpServletRequest request
    ) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");

        RepeatedTransaction rt = new RepeatedTransaction();
        rt.setUser(owner);
        rt.setName(req.name);
        rt.setAccount(req.account);
        rt.setAmount(BigDecimal.valueOf(req.amount));
        rt.setDate(req.date);
        rt.setFrequency(req.frequency);

        return ResponseEntity.ok(repo.save(rt));
    }

    // PUT /api/repeated-transactions/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody RepeatedTransactionRequest req,
            HttpServletRequest request
    ) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");

        Optional<RepeatedTransaction> opt = repo.findByIdAndUserId(id, owner.getId());
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body("Not found");
        }

        RepeatedTransaction rt = opt.get();
        rt.setName(req.name);
        rt.setAccount(req.account);
        rt.setAmount(BigDecimal.valueOf(req.amount));
        rt.setDate(req.date);
        rt.setFrequency(req.frequency);

        return ResponseEntity.ok(repo.save(rt));
    }

    // DELETE /api/repeated-transactions/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null) return ResponseEntity.status(401).body("Unauthorized");

        Optional<RepeatedTransaction> opt = repo.findByIdAndUserId(id, owner.getId());
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body("Not found");
        }

        repo.delete(opt.get());
        return ResponseEntity.noContent().build();
    }
}