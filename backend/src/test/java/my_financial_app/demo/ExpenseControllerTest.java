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
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockReset;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(ExpenseController.class)
class ExpenseControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    @MockitoBean(reset = MockReset.AFTER)
    ExpenseRepository expenseRepository;

    @MockitoBean(reset = MockReset.AFTER)
    UserRepository userRepository;


    private String toJson(Object o) throws Exception { return om.writeValueAsString(o); }

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

    private Expense mkExpense(Long id, User owner, Expense.EntryType type,
                              String category, double amount, LocalDateTime occurredAt) {

        Expense e = new Expense();
        set(e, "id", id);
        e.setUser(owner);
        e.setType(type);
        e.setCategory(category);
        e.setAmount(BigDecimal.valueOf(amount));
        e.setOccurredAt(occurredAt);
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


    // ---------- Tests ----------

    @Test
    void create_expense_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var saved = mkExpense(100L, user, Expense.EntryType.EXPENSE,
                "อาหาร", 120.5, LocalDateTime.parse("2025-01-05T08:00:00"));

        Mockito.when(expenseRepository.save(ArgumentMatchers.any())).thenReturn(saved);

        var body = Map.of(
                "type", "ค่าใช้จ่าย",
                "category", "อาหาร",
                "amount", 120.5,
                "note", "ข้าวกลางวัน",
                "place", "ร้าน A",
                "occurredAt", "2025-01-05T08:00:00",
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
                        .content("""
            {
                "type": "EXPENSE",
                "category": "อาหาร",
                "amount": 100,
                "occurredAt": "2025-01-01T00:00:00"
            }
            """))
                .andExpect(status().isUnauthorized());
    }



    @Test
    void create_income_viaAlias_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var saved = mkExpense(101L, user, Expense.EntryType.INCOME,
                "เงินเดือน", 1000.0, LocalDateTime.parse("2025-01-01T09:00:00"));

        Mockito.when(expenseRepository.save(ArgumentMatchers.any())).thenReturn(saved);

        var body = Map.of(
                "type", "ignored",
                "category", "เงินเดือน",
                "amount", 1000.0,
                "note", "jan",
                "place", "office",
                "occurredAt", "2025-01-01T09:00:00",
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

        var saved = mkExpense(102L, user, Expense.EntryType.EXPENSE,
                "เดินทาง", 50.0, LocalDateTime.parse("2025-01-02T07:30:00"));

        Mockito.when(expenseRepository.save(ArgumentMatchers.any())).thenReturn(saved);

        var body = Map.of(
                "type", "ignored",
                "category", "เดินทาง",
                "amount", 50.0,
                "note", "BTS",
                "place", "BKK",
                "occurredAt", "2025-01-02T07:30:00",
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


    @Test
    void listMine_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var e1 = mkExpense(1L, user, Expense.EntryType.EXPENSE,
                "อาหาร", 10, LocalDateTime.parse("2025-01-02T10:00:00"));

        var e2 = mkExpense(2L, user, Expense.EntryType.EXPENSE,
                "เดินทาง", 20, LocalDateTime.parse("2025-01-03T11:00:00"));

        Mockito.when(expenseRepository.findByUserIdOrderByOccurredAtDesc(1L))
                .thenReturn(List.of(e1, e2));

        mvc.perform(get("/api/expenses").session(sessionAs("ken")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }


    @Test
    void listMine_unauthorized() throws Exception {
        mvc.perform(get("/api/expenses"))
                .andExpect(status().isUnauthorized());
    }


    @Test
    void listByRange_success() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var e = mkExpense(3L, user, Expense.EntryType.EXPENSE,
                "อื่น ๆ", 33, LocalDateTime.parse("2025-01-03T13:00:00"));

        Mockito.when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(
                Mockito.eq(1L),
                ArgumentMatchers.any(LocalDateTime.class),
                ArgumentMatchers.any(LocalDateTime.class)
        )).thenReturn(List.of(e));

        mvc.perform(get("/api/expenses/range")
                        .param("start", "2025-01-01")
                        .param("end", "2025-01-31")
                        .session(sessionAs("ken")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }


    @Test
    void update_notFound_returns404() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        Mockito.when(expenseRepository.findByIdAndUserId(999L, 1L))
                .thenReturn(Optional.empty());

        var body = Map.of(
                "type","ค่าใช้จ่าย",
                "category","อาหาร",
                "amount",10.0,
                "occurredAt","2025-01-01T00:00:00",
                "note","n",
                "place","p",
                "paymentMethod","CASH",
                "iconKey","food"
        );

        mvc.perform(put("/api/expenses/999")
                        .session(sessionAs("ken"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(body)))
                .andExpect(status().isNotFound());
    }


    @Test
    void update_success_returnsOk() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var existing = mkExpense(5L, user, Expense.EntryType.EXPENSE,
                "อาหาร", 10, LocalDateTime.parse("2025-01-01T08:00:00"));

        Mockito.when(expenseRepository.findByIdAndUserId(5L, 1L))
                .thenReturn(Optional.of(existing));

        var saved = mkExpense(5L, user, Expense.EntryType.EXPENSE,
                "อาหาร", 99, LocalDateTime.parse("2025-01-10T00:00:00"));

        Mockito.when(expenseRepository.save(ArgumentMatchers.any())).thenReturn(saved);

        var body = Map.of(
                "type","ค่าใช้จ่าย",
                "category","อาหาร",
                "amount",99.0,
                "occurredAt","2025-01-10T00:00:00",
                "note","n",
                "place","p",
                "paymentMethod","CASH",
                "iconKey","food"
        );

        mvc.perform(put("/api/expenses/5")
                        .session(sessionAs("ken"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5));
    }


    @Test
    void delete_unauthorized() throws Exception {
        mvc.perform(delete("/api/expenses/1"))
                .andExpect(status().isUnauthorized());
    }


    @Test
    void delete_notFound_returns404() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        Mockito.when(expenseRepository.findByIdAndUserId(999L, 1L))
                .thenReturn(Optional.empty());

        mvc.perform(delete("/api/expenses/999").session(sessionAs("ken")))
                .andExpect(status().isNotFound());
    }


    @Test
    void delete_success_returns204() throws Exception {
        var user = mkUser(1L, "ken");
        Mockito.when(userRepository.findByUsername("ken")).thenReturn(Optional.of(user));

        var existing = mkExpense(7L, user, Expense.EntryType.EXPENSE,
                "อาหาร", 10, LocalDateTime.parse("2025-01-01T08:00:00"));

        Mockito.when(expenseRepository.findByIdAndUserId(7L, 1L))
                .thenReturn(Optional.of(existing));

        mvc.perform(delete("/api/expenses/7").session(sessionAs("ken")))
                .andExpect(status().isNoContent());
    }
}
