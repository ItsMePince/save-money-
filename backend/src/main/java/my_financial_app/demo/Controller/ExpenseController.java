package my_financial_app.demo.Controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Locale;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import my_financial_app.demo.Entity.Expense;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.ExpenseRepository;
import my_financial_app.demo.Repository.UserRepository;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(
        origins = {"http://localhost:3000","http://localhost:5173"},
        allowCredentials = "true"
)
public class ExpenseController {

    private final ExpenseRepository repo;
    private final UserRepository userRepo;

    public ExpenseController(ExpenseRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<?> create(
            HttpServletRequest request,
            @Valid @RequestBody CreateExpenseRequest req
    ) {
        User owner = requireLoginUserEarly(request);
        if (owner == null)
            return ResponseEntity.status(401).body("Unauthorized");

        Expense e = new Expense();
        e.setUser(owner);
        e.setType(normalizeType(req.type));
        e.setCategory(req.category);
        e.setAmount(BigDecimal.valueOf(req.amount));
        e.setNote(req.note);
        e.setPlace(req.place);
        e.setOccurredAt(req.occurredAt);
        e.setPaymentMethod(req.paymentMethod);
        e.setIconKey(req.iconKey);
        return ResponseEntity.ok(repo.save(e));
    }

    @PostMapping("/incomes")
    public ResponseEntity<?> createIncome(
            @Valid @RequestBody CreateExpenseRequest req,
            HttpServletRequest request
    ) {
        req.type = "INCOME";
        return create(request, req);
    }

    @PostMapping("/spendings")
    public ResponseEntity<?> createExpense(
            @Valid @RequestBody CreateExpenseRequest req,
            HttpServletRequest request
    ) {
        req.type = "EXPENSE";
        return create(request, req);
    }

    @GetMapping
    public ResponseEntity<?> listMine(HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null)
            return ResponseEntity.status(401).body("Unauthorized");
        return ResponseEntity.ok(repo.findByUserIdOrderByOccurredAtDesc(owner.getId()));
    }

    @GetMapping("/range")
    public ResponseEntity<?> listByRange(
            @RequestParam String start,
            @RequestParam String end,
            HttpServletRequest request
    ) {
        User owner = requireLoginUser(request);
        if (owner == null)
            return ResponseEntity.status(401).body("Unauthorized");

        LocalDate s = LocalDate.parse(start);
        LocalDate e = LocalDate.parse(end);
        LocalDateTime from = s.atStartOfDay();
        LocalDateTime to = e.atTime(LocalTime.of(23, 59, 59));

        return ResponseEntity.ok(
                repo.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(owner.getId(), from, to)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOne(
            @PathVariable Long id,
            @Valid @RequestBody CreateExpenseRequest req,
            HttpServletRequest request
    ) {
        User owner = requireLoginUser(request);
        if (owner == null)
            return ResponseEntity.status(401).body("Unauthorized");

        Optional<Expense> opt = repo.findByIdAndUserId(id, owner.getId());
        if (opt.isEmpty())
            return ResponseEntity.status(404).build();

        Expense e = opt.get();
        e.setType(normalizeType(req.type));
        e.setCategory(req.category);
        e.setAmount(BigDecimal.valueOf(req.amount));
        e.setNote(req.note);
        e.setPlace(req.place);
        e.setOccurredAt(req.occurredAt);
        e.setPaymentMethod(req.paymentMethod);
        e.setIconKey(req.iconKey);
        return ResponseEntity.ok(repo.save(e));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOne(@PathVariable Long id, HttpServletRequest request) {
        User owner = requireLoginUser(request);
        if (owner == null)
            return ResponseEntity.status(401).body("Unauthorized");

        Optional<Expense> opt = repo.findByIdAndUserId(id, owner.getId());
        if (opt.isEmpty())
            return ResponseEntity.status(404).body("Not found");

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private User requireLoginUserEarly(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Object username = session.getAttribute("username");
        if (username == null) return null;
        return userRepo.findByUsername(username.toString()).orElse(null);
    }

    private User requireLoginUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        String username = (session != null) ? (String) session.getAttribute("username") : null;
        if (username == null || username.isBlank()) return null;
        return userRepo.findByUsername(username).orElse(null);
    }

    private static Expense.EntryType normalizeType(String raw) {
        if (raw == null) return Expense.EntryType.EXPENSE;
        String s = raw.trim().toLowerCase(Locale.ROOT);
        if (s.equals("รายได้") || s.equals("income") || s.equals("incomes"))
            return Expense.EntryType.INCOME;
        if (s.equals("ค่าใช้จ่าย") || s.equals("expense") || s.equals("expenses")
                || s.equals("spending") || s.equals("spendings"))
            return Expense.EntryType.EXPENSE;
        return Expense.EntryType.EXPENSE;
    }
}
