package my_financial_app.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import my_financial_app.demo.Controller.ExpenseController;
import my_financial_app.demo.Entity.Expense;
import my_financial_app.demo.Entity.Role;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.ExpenseRepository;
import my_financial_app.demo.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(ExpenseController.class)
class ExpenseControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    @MockBean ExpenseRepository expenseRepository;
    @MockBean UserRepository userRepository;

    private String toJson(Object o) throws Exception { return om.writeValueAsString(o); }

    // ----- helpers (ตั้งค่า field ที่ไม่มี setter ด้วย reflection) -----
    private static void set(Object target, String field, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception ignore) {}
    }

    private User mkUser(Long id, String username) {
        User u = new User();
        set(u, "id", id);
        set(u, "role", Role.USER);
        u.setUsername(username);
        u.setEmail(username + "@ex.com");
        u.setPassword("secret");
        return u;
    }

    private Expense mkExpense(Long id, User owner, Expense.EntryType type, String category, double amount, LocalDate date) {
        Expense e = new Expense();
        set(e, "id", id);
        e.setUser(owner);
        e.setType(type);
        e.setCategory(category);
        e.setAmount(BigDecimal.valueOf(amount));
        e.setDate(date);
        e.setNote("n");
        e.setPlace("p");
        e.setPaymentMethod("CASH");
        e.setIconKey("food");
        return e;
    }

    private MockHttpSession sessionAs(String username) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute("username", username);
        return s;
    }

    // ------------- POST /api/expenses (create) -------------
    @Test
    void create_expense_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var saved = mkExpense(100L, user, Expense.EntryType.EXPENSE, "อาหาร", 120.5, LocalDate.parse("2025-01-05"));
        Mockito.when(expenseRepository.save(ArgumentMatchers.any(Expense.class))).thenReturn(saved);

        var body = Map.of(
                "type", "ค่าใช้จ่าย",
                "category", "อาหาร",
                "amount", 120.5,
                "note", "ข้าวกลางวัน",
                "place", "ร้าน A",
                "date", "2025-01-05",
                "paymentMethod", "CASH",
                "iconKey", "food"
        );

        mvc.perform(post("/api/expenses")
                        .session(sessionAs("ken"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100));
    }

    @Test
    void create_unauthorized_whenNoSession() throws Exception {
        mvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of())))
                .andExpect(status().isUnauthorized());
    }

    // ------------- aliases: /incomes , /spendings -------------
    @Test
    void create_income_viaAlias_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var saved = mkExpense(101L, user, Expense.EntryType.INCOME, "เงินเดือน", 1000.0, LocalDate.parse("2025-01-01"));
        Mockito.when(expenseRepository.save(ArgumentMatchers.any(Expense.class))).thenReturn(saved);

        var body = Map.of(
                "type", "อะไรก็ได้จะถูก override",
                "category", "เงินเดือน",
                "amount", 1000.0,
                "note", "jan",
                "place", "office",
                "date", "2025-01-01",
                "paymentMethod", "BANK",
                "iconKey", "salary"
        );

        mvc.perform(post("/api/expenses/incomes")
                        .session(sessionAs("ken"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101));
    }

    @Test
    void create_spending_viaAlias_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var saved = mkExpense(102L, user, Expense.EntryType.EXPENSE, "เดินทาง", 50.0, LocalDate.parse("2025-01-02"));
        Mockito.when(expenseRepository.save(ArgumentMatchers.any(Expense.class))).thenReturn(saved);

        var body = Map.of(
                "type", "จะถูก override",
                "category", "เดินทาง",
                "amount", 50.0,
                "note", "BTS",
                "place", "BKK",
                "date", "2025-01-02",
                "paymentMethod", "CARD",
                "iconKey", "train"
        );

        mvc.perform(post("/api/expenses/spendings")
                        .session(sessionAs("ken"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(102));
    }

    // ------------- GET /api/expenses (list mine) -------------
    @Test
    void listMine_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var e1 = mkExpense(1L, user, Expense.EntryType.EXPENSE, "อาหาร", 10, LocalDate.parse("2025-01-01"));
        var e2 = mkExpense(2L, user, Expense.EntryType.EXPENSE, "เดินทาง", 20, LocalDate.parse("2025-01-02"));
        Mockito.when(expenseRepository.findByUserIdOrderByDateDesc(1L)).thenReturn(List.of(e1, e2));

        mvc.perform(get("/api/expenses").session(sessionAs("ken")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void listMine_unauthorized() throws Exception {
        mvc.perform(get("/api/expenses"))
                .andExpect(status().isUnauthorized());
    }

    // ------------- GET /api/expenses/range -------------
    @Test
    void listByRange_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var e = mkExpense(3L, user, Expense.EntryType.EXPENSE, "อื่น ๆ", 33, LocalDate.parse("2025-01-03"));
        Mockito.when(expenseRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                1L, LocalDate.parse("2025-01-01"), LocalDate.parse("2025-01-31")
        )).thenReturn(List.of(e));

        mvc.perform(get("/api/expenses/range")
                        .param("start", "2025-01-01")
                        .param("end", "2025-01-31")
                        .session(sessionAs("ken")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // ------------- PUT /api/expenses/{id} -------------
    @Test
    void update_notFound_returns404() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));
        Mockito.when(expenseRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        mvc.perform(put("/api/expenses/999")
                        .session(sessionAs("ken"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "type","ค่าใช้จ่าย","category","อาหาร","amount",10.0,"date","2025-01-01"
                        ))))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_success_returnsOk() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var existing = mkExpense(5L, user, Expense.EntryType.EXPENSE, "อาหาร", 10, LocalDate.parse("2025-01-01"));
        Mockito.when(expenseRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));

        var saved = mkExpense(5L, user, Expense.EntryType.EXPENSE, "อาหาร", 99, LocalDate.parse("2025-01-10"));
        Mockito.when(expenseRepository.save(ArgumentMatchers.any(Expense.class))).thenReturn(saved);

        mvc.perform(put("/api/expenses/5")
                        .session(sessionAs("ken"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "type","ค่าใช้จ่าย","category","อาหาร","amount",99.0,"date","2025-01-10",
                                "note","n","place","p","paymentMethod","CASH","iconKey","food"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5));
    }

    // ------------- DELETE /api/expenses/{id} -------------
    @Test
    void delete_unauthorized() throws Exception {
        mvc.perform(delete("/api/expenses/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void delete_notFound_returns404() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));
        Mockito.when(expenseRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        mvc.perform(delete("/api/expenses/999").session(sessionAs("ken")))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_success_returns204() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var existing = mkExpense(7L, user, Expense.EntryType.EXPENSE, "อาหาร", 10, LocalDate.parse("2025-01-01"));
        Mockito.when(expenseRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(existing));
        // deleteById เป็น void → ไม่ต้อง mock เพิ่ม

        mvc.perform(delete("/api/expenses/7").session(sessionAs("ken")))
                .andExpect(status().isNoContent());
    }
}
