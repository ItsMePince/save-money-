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
import java.time.LocalDateTime; // Import LocalDateTime
import java.time.LocalTime;   // Import LocalTime

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

    // ต้องสันนิษฐานว่า CreateExpenseRequest อยู่ใน package เดียวกัน (ไม่ใช่ inner class)
    // (หากย้ายไป DTO package อื่น ต้อง import)
    // private static class CreateExpenseRequest {
    //     public String type;
    //     public String category;
    //     public double amount;
    //     public String note;
    //     public String place;
    //     public LocalDateTime occurredAt; // <--- CHANGED
    //     public String paymentMethod;
    //     public String iconKey;
    // }

    @BeforeEach
    void setup() {
        expenseRepo.deleteAll();
        userRepo.deleteAll();
        user = new User("john", "pass123", "john@example.com");
        userRepo.save(user);
        session = new MockHttpSession();
        session.setAttribute("username", user.getUsername());
    }

    // อัปเดต DTO ให้ตรงกับ Controller (สันนิษฐานว่า CreateExpenseRequest เป็น class แยก)
    private CreateExpenseRequest sampleRequest() {
        // ใช้ CreateExpenseRequest (ไม่ใช่ ExpenseController.CreateExpenseRequest)
        CreateExpenseRequest req = new CreateExpenseRequest();
        req.type = "ค่าใช้จ่าย";
        req.category = "อาหาร";
        req.amount = 120.50;
        req.note = "ข้าวมันไก่";
        req.place = "ตลาด";
        req.occurredAt = LocalDateTime.now(); // <--- CHANGED (from date: String)
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
    // (Test 2 ตัวนี้ยังใช้ได้ เพราะ controller ใหม่มี logic normalizeType)
    @Test
    void createIncome_shortcut_setsTypeIncome() throws Exception {
        var req = sampleRequest();
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
        var req = sampleRequest();
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
        e.setOccurredAt(LocalDateTime.now()); // <--- CHANGED (from setDate)
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
        // Controller ค้นหาแบบ atStartOfDay()
        e1.setOccurredAt(LocalDate.of(2025, 9, 1).atStartOfDay()); // <--- CHANGED
        expenseRepo.save(e1);

        Expense e2 = new Expense();
        e2.setUser(user);
        e2.setType(Expense.EntryType.EXPENSE);
        e2.setCategory("อาหาร");
        e2.setAmount(BigDecimal.valueOf(200));
        e2.setOccurredAt(LocalDate.of(2025, 9, 20).atStartOfDay()); // <--- CHANGED
        expenseRepo.save(e2);

        // Controller จะค้นหา (2025-09-01 00:00:00) ถึง (2025-09-10 23:59:59)
        mockMvc.perform(get("/api/expenses/range")
                        .param("start", "2025-09-01")
                        .param("end", "2025-09-10")
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)) // e1 (9/1) ถูกรวม, e2 (9/20) ไม่ถูกรวม
                .andExpect(jsonPath("$[0].category").value("ของใช้"));
    }

    @Test
    void listByRange_inclusiveBounds() throws Exception {
        var d1 = LocalDate.of(2025, 9, 1);
        var d2 = LocalDate.of(2025, 9, 10);

        Expense a = new Expense();
        a.setUser(user); a.setType(Expense.EntryType.EXPENSE);
        a.setCategory("start"); a.setAmount(new BigDecimal("1.00"));
        a.setOccurredAt(d1.atStartOfDay()); // <--- CHANGED (00:00:00)
        expenseRepo.save(a);

        Expense b = new Expense();
        b.setUser(user); b.setType(Expense.EntryType.EXPENSE);
        b.setCategory("end"); b.setAmount(new BigDecimal("2.00"));
        // Controller ค้นหาถึง 23:59:59 ของวันสิ้นสุด
        a.setOccurredAt(d2.atTime(LocalTime.of(23, 59, 59))); // <--- CHANGED
        expenseRepo.save(b);

        mockMvc.perform(get("/api/expenses/range")
                        .param("start", d1.toString())
                        .param("end", d2.toString())
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2)); // ทั้งคู่ควรถูกรวม
    }

    // ---------- Update ----------
    @Test
    void updateExpense_success() throws Exception {
        Expense e = new Expense();
        e.setUser(user);
        e.setType(Expense.EntryType.EXPENSE);
        e.setCategory("เดินทาง");
        e.setAmount(BigDecimal.valueOf(50));
        e.setOccurredAt(LocalDateTime.now()); // <--- CHANGED
        expenseRepo.save(e);

        var req = sampleRequest(); // req จะใช้ occurredAt (LocalDateTime)
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
        e.setOccurredAt(LocalDate.of(2025, 9, 5).atStartOfDay()); // <--- CHANGED
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
    // (Test นี้ต้องเขียนใหม่ทั้งหมด เพราะ controller ไม่ parse String date แล้ว)
    @Test
    void create_withLocalDateTime_persistsFields() throws Exception {
        var req = sampleRequest();
        LocalDateTime testTime = LocalDateTime.of(2025, 9, 1, 14, 30, 0);
        req.occurredAt = testTime; // <--- SET Specific LocalDateTime
        req.paymentMethod = "CARD";
        req.iconKey = "🍜";

        var mvcRes = mockMvc.perform(post("/api/expenses")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                // Jackson default ISO-8601 serialization
                .andExpect(jsonPath("$.occurredAt").value("2025-09-01T14:30:00"))
                .andExpect(jsonPath("$.paymentMethod").value("CARD"))
                .andExpect(jsonPath("$.iconKey").value("🍜"))
                .andReturn();

        // ตรวจ BigDecimal และ LocalDateTime ใน DB
        var json = mvcRes.getResponse().getContentAsString();
        var saved = objectMapper.readTree(json);
        Long id = saved.get("id").asLong();

        var inDb = expenseRepo.findById(id).orElseThrow();
        assertThat(inDb.getAmount()).isEqualByComparingTo("120.50");
        assertThat(inDb.getOccurredAt()).isEqualTo(testTime); // <--- Check LocalDateTime
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
        e.setOccurredAt(LocalDateTime.now()); // <--- CHANGED
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