package my_financial_app.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import my_financial_app.demo.Entity.Expense;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.ExpenseRepository;
import my_financial_app.demo.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExpenseControllerIT {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepo;
    @Autowired private ExpenseRepository expenseRepo;

    private MockHttpSession session;
    private User user;

    static class CreateExpenseRequest {
        public String type;
        public String category;
        public double amount;
        public String note;
        public String place;
        public LocalDateTime occurredAt;
        public String paymentMethod;
        public String iconKey;
    }

    @BeforeEach
    void setup() {
        expenseRepo.deleteAll();
        userRepo.deleteAll();

        user = new User("john", "pass123", "john@mail.com");
        userRepo.save(user);

        session = new MockHttpSession();
        session.setAttribute("username", user.getUsername());
    }

    private CreateExpenseRequest req() {
        CreateExpenseRequest r = new CreateExpenseRequest();
        r.type = "ค่าใช้จ่าย";
        r.category = "อาหาร";
        r.amount = 100.00;
        r.note = "ข้าวมันไก่";
        r.place = "เซเว่น";
        r.occurredAt = LocalDateTime.of(2025, 1, 5, 12, 30);
        r.paymentMethod = "CASH";
        r.iconKey = "food";
        return r;
    }

    // ---------------- CREATE ----------------

    @Test
    void create_success() throws Exception {
        var body = req();

        mvc.perform(post("/api/expenses")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("อาหาร"));

        assertThat(expenseRepo.findAll()).hasSize(1);
    }

    @Test
    void create_unauthorized_noSession() throws Exception {
        var body = req();

        mvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- SHORTCUT /incomes ----------------

    @Test
    void create_income() throws Exception {
        var body = req();
        body.type = "อะไรก็ได้";

        mvc.perform(post("/api/expenses/incomes")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("INCOME"));
    }

    // ---------------- SHORTCUT /spendings ----------------

    @Test
    void create_spending() throws Exception {
        var body = req();

        mvc.perform(post("/api/expenses/spendings")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("EXPENSE"));
    }

    // ---------------- LIST MINE ----------------

    @Test
    void listMine() throws Exception {
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("เดินทาง");
        e.setAmount(BigDecimal.valueOf(70));
        e.setOccurredAt(LocalDateTime.now());
        expenseRepo.save(e);

        mvc.perform(get("/api/expenses").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("เดินทาง"));
    }

    @Test
    void listMine_unauthorized() throws Exception {
        mvc.perform(get("/api/expenses"))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- RANGE ----------------

    @Test
    void listByRange() throws Exception {
        Expense a = new Expense();
        a.setUser(user);
        a.setType(Expense.EntryType.EXPENSE);
        a.setCategory("ของใช้");
        a.setAmount(BigDecimal.valueOf(99));
        a.setOccurredAt(LocalDate.of(2025, 9, 1).atStartOfDay());
        expenseRepo.save(a);

        Expense b = new Expense();
        b.setUser(user);
        b.setType(Expense.EntryType.EXPENSE);
        b.setCategory("อาหาร");
        b.setAmount(BigDecimal.valueOf(199));
        b.setOccurredAt(LocalDate.of(2025, 9, 20).atStartOfDay());
        expenseRepo.save(b);

        mvc.perform(get("/api/expenses/range")
                        .session(session)
                        .param("start", "2025-09-01")
                        .param("end", "2025-09-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].category").value("ของใช้"));
    }

    @Test
    void listByRange_unauthorized() throws Exception {
        mvc.perform(get("/api/expenses/range")
                        .param("start", "2025-01-01")
                        .param("end", "2025-01-05"))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- UPDATE ----------------

    @Test
    void update_success() throws Exception {
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("เดินทาง");
        e.setAmount(BigDecimal.valueOf(50));
        e.setOccurredAt(LocalDateTime.now());
        expenseRepo.save(e);

        var body = req();
        body.category = "แก้ไขแล้ว";

        mvc.perform(put("/api/expenses/" + e.getId())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("แก้ไขแล้ว"));
    }

    @Test
    void update_notFound() throws Exception {
        var body = req();

        mvc.perform(put("/api/expenses/99999")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }

    // ---------------- DELETE ----------------

    @Test
    void delete_success() throws Exception {
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("ของใช้");
        e.setAmount(BigDecimal.valueOf(30));
        e.setOccurredAt(LocalDateTime.now());
        expenseRepo.save(e);

        mvc.perform(delete("/api/expenses/" + e.getId()).session(session))
                .andExpect(status().isNoContent());

        assertThat(expenseRepo.findAll()).isEmpty();
    }

    @Test
    void delete_unauthorized() throws Exception {
        mvc.perform(delete("/api/expenses/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void delete_notFound() throws Exception {
        mvc.perform(delete("/api/expenses/999")
                        .session(session))
                .andExpect(status().isNotFound());
    }

    // ---------------- SESSION USER NOT FOUND ----------------

    @Test
    void unauthorized_whenSessionUserNotExist() throws Exception {
        MockHttpSession ghost = new MockHttpSession();
        ghost.setAttribute("username", "ghost");

        mvc.perform(get("/api/expenses").session(ghost))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/expenses")
                        .session(ghost)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req())))
                .andExpect(status().isUnauthorized());
    }
}
