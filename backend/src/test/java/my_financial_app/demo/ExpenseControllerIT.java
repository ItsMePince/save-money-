package my_financial_app.demo.Controller;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // ใช้ application-test.properties (H2 in-memory)
class ExpenseControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepo;
    @Autowired private ExpenseRepository expenseRepo;

    private MockHttpSession session;
    private User user;

    @BeforeEach
    void setup() {
        expenseRepo.deleteAll();
        userRepo.deleteAll();

        user = new User("john", "pass123", "john@example.com");
        userRepo.save(user);

        session = new MockHttpSession();
        session.setAttribute("username", user.getUsername());
    }

    private ExpenseController.CreateExpenseRequest sampleRequest() {
        ExpenseController.CreateExpenseRequest req = new ExpenseController.CreateExpenseRequest();
        req.type = "ค่าใช้จ่าย";
        req.category = "อาหาร";
        req.amount = 120.50;
        req.note = "ข้าวมันไก่";
        req.place = "ตลาด";
        req.date = LocalDate.now().toString();
        req.paymentMethod = "CASH";
        req.iconKey = "🍚";
        return req;
    }

    // ---------- Create ----------
    @Test
    void createExpense_success() throws Exception {
        var req = sampleRequest();

        mockMvc.perform(post("/api/expenses")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.category").value("อาหาร"));

        assertThat(expenseRepo.findAll()).hasSize(1);
    }

    @Test
    void createExpense_unauthorized() throws Exception {
        var req = sampleRequest();

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Shortcuts (/incomes, /spendings) ----------
    @Test
    void createIncome_shortcut_setsTypeIncome() throws Exception {
        var req = sampleRequest();        // ไม่สน type ที่ส่งมา เพราะ endpoint จะบังคับเป็น "รายได้"
        req.type = "ค่าใช้จ่าย";

        mockMvc.perform(post("/api/expenses/incomes")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("INCOME"));
    }

    @Test
    void createSpending_shortcut_setsTypeExpense() throws Exception {
        var req = sampleRequest(); // เดิมก็ "ค่าใช้จ่าย"
        mockMvc.perform(post("/api/expenses/spendings")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("EXPENSE"));
    }

    // ---------- List mine ----------
    @Test
    void listMine_returnsUserExpenses() throws Exception {
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("เดินทาง");
        e.setAmount(BigDecimal.valueOf(50));
        e.setDate(LocalDate.now());
        expenseRepo.save(e);

        mockMvc.perform(get("/api/expenses").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("เดินทาง"));
    }

    // ---------- Range ----------
    @Test
    void listByRange_returnsFilteredExpenses() throws Exception {
        Expense e1 = new Expense();
        e1.setUser(user);
        e1.setType(Expense.EntryType.EXPENSE);
        e1.setCategory("ของใช้");
        e1.setAmount(BigDecimal.valueOf(100));
        e1.setDate(LocalDate.of(2025, 9, 1));
        expenseRepo.save(e1);

        Expense e2 = new Expense();
        e2.setUser(user);
        e2.setType(Expense.EntryType.EXPENSE);
        e2.setCategory("อาหาร");
        e2.setAmount(BigDecimal.valueOf(200));
        e2.setDate(LocalDate.of(2025, 9, 20));
        expenseRepo.save(e2);

        mockMvc.perform(get("/api/expenses/range")
                        .param("start", "2025-09-01")
                        .param("end", "2025-09-10")
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].category").value("ของใช้"));
    }

    @Test
    void listByRange_inclusiveBounds() throws Exception {
        var d1 = LocalDate.of(2025, 9, 1);
        var d2 = LocalDate.of(2025, 9, 10);

        Expense a = new Expense();
        a.setUser(user); a.setType(Expense.EntryType.EXPENSE);
        a.setCategory("start"); a.setAmount(new BigDecimal("1.00")); a.setDate(d1);
        expenseRepo.save(a);

        Expense b = new Expense();
        b.setUser(user); b.setType(Expense.EntryType.EXPENSE);
        b.setCategory("end"); b.setAmount(new BigDecimal("2.00")); b.setDate(d2);
        expenseRepo.save(b);

        mockMvc.perform(get("/api/expenses/range")
                        .param("start", d1.toString())
                        .param("end", d2.toString())
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    // ---------- Update ----------
    @Test
    void updateExpense_success() throws Exception {
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("เดินทาง");
        e.setAmount(BigDecimal.valueOf(50));
        e.setDate(LocalDate.now());
        expenseRepo.save(e);

        var req = sampleRequest();
        req.category = "แก้ไขแล้ว";

        mockMvc.perform(put("/api/expenses/" + e.getId())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("แก้ไขแล้ว"));
    }

    @Test
    void updateExpense_notFound() throws Exception {
        var req = sampleRequest();

        mockMvc.perform(put("/api/expenses/999999")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_delete_otherUsers_get404() throws Exception {
        // ของ user A
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("A");
        e.setAmount(new BigDecimal("10.00"));
        e.setDate(LocalDate.of(2025, 9, 5));
        expenseRepo.save(e);

        // ล็อกอินเป็น user B
        var b = new User("mary", "p", "mary@example.com");
        userRepo.save(b);
        var otherSession = new MockHttpSession();
        otherSession.setAttribute("username", b.getUsername());

        // PUT → 404
        var req = sampleRequest();
        req.category = "B-try";
        mockMvc.perform(put("/api/expenses/" + e.getId())
                        .session(otherSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());

        // DELETE → 404
        mockMvc.perform(delete("/api/expenses/" + e.getId())
                        .session(otherSession))
                .andExpect(status().isNotFound());
    }

    // ---------- Date parse + persist fields ----------
    @Test
    void create_withSlashDate_parsedSuccessfully_andPersistsFields() throws Exception {
        var req = sampleRequest();
        req.date = "1/9/2025";   // d/M/uuuu
        req.paymentMethod = "CARD";
        req.iconKey = "🍜";

        var mvcRes = mockMvc.perform(post("/api/expenses")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2025-09-01"))
                .andExpect(jsonPath("$.paymentMethod").value("CARD"))
                .andExpect(jsonPath("$.iconKey").value("🍜"))
                .andReturn();

        // ตรวจ BigDecimal ใน DB
        var json = mvcRes.getResponse().getContentAsString();
        var saved = objectMapper.readTree(json);
        Long id = saved.get("id").asLong();
        var inDb = expenseRepo.findById(id).orElseThrow();
        assertThat(inDb.getAmount()).isEqualByComparingTo("120.50");
    }

    // ---------- Unauthorized (endpoints อื่น ๆ) ----------
    @Test
    void unauthorized_on_other_endpoints() throws Exception {
        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/expenses/range")
                        .param("start","2025-09-01")
                        .param("end","2025-09-10"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/expenses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/expenses/1"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Delete ----------
    @Test
    void deleteExpense_success() throws Exception {
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("ของใช้");
        e.setAmount(BigDecimal.valueOf(30));
        e.setDate(LocalDate.now());
        expenseRepo.save(e);

        mockMvc.perform(delete("/api/expenses/" + e.getId()).session(session))
                .andExpect(status().isNoContent());

        assertThat(expenseRepo.findAll()).isEmpty();
    }


    @Test
    void unauthorized_whenSessionUserNotExist() throws Exception {
        // มี session แต่ username ไม่อยู่ใน DB
        var ghostSession = new MockHttpSession();
        ghostSession.setAttribute("username", "ghost-user");

        mockMvc.perform(get("/api/expenses").session(ghostSession))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/expenses")
                        .session(ghostSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isUnauthorized());
    }

}
