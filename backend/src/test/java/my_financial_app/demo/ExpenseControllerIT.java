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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ExpenseControllerIT {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepo;
    @Autowired private ExpenseRepository expenseRepo;

    private MockHttpSession session;
    private User user;

    // ⭐ Request DTO ใช้ตรงตาม Controller
    static class CreateExpenseRequest {
        public String type;
        public String category;
        public double amount;
        public String note;
        public String place;
        public LocalDateTime occurredAt;
        public String paymentMethod;
        public String iconKey;
        public OffsetDateTime createdAt; // จำเป็นต้องมี
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

    // ใช้สร้าง request พร้อม createdAt (NOT NULL)
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
        r.createdAt = OffsetDateTime.now(ZoneOffset.UTC);
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
    void create_unauthorized() throws Exception {
        mvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req())))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- INCOME ----------------

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

    // ---------------- SPENDING ----------------

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
    void listMine_unauthorized() throws Exception {
        mvc.perform(get("/api/expenses"))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- RANGE ----------------

    @Test
    void listByRange_unauthorized() throws Exception {
        mvc.perform(get("/api/expenses/range")
                        .param("start", "2025-01-01")
                        .param("end", "2025-01-05"))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- UPDATE ----------------



    @Test
    void update_notFound() throws Exception {
        mvc.perform(put("/api/expenses/99999")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req())))
                .andExpect(status().isNotFound());
    }

    // ---------------- DELETE ----------------



    @Test
    void delete_unauthorized() throws Exception {
        mvc.perform(delete("/api/expenses/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void delete_notFound() throws Exception {
        mvc.perform(delete("/api/expenses/999").session(session))
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
