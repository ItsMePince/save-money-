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

    @MockBean ExpenseRepository expenseRepository;
    @MockBean UserRepository userRepository;

    private MockHttpSession sessionAs(String username) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute("username", username);
        return s;
    }

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
        u.setEmail(username + "@test.com");
        u.setPassword("1234");
        return u;
    }

    private Expense mkExpense(Long id, User owner, Expense.EntryType type, String category, double amount) {
        Expense e = new Expense();
        set(e, "id", id);
        e.setUser(owner);
        e.setType(type);
        e.setCategory(category);
        e.setAmount(BigDecimal.valueOf(amount));
        e.setOccurredAt(LocalDateTime.parse("2025-01-01T00:00:00"));
        e.setPaymentMethod("CASH");
        e.setIconKey("food");
        return e;
    }


    // 🔥 FINAL — Unauthorized test ที่ถูกต้อง 100%
    @Test
    void create_unauthorized_whenNoSession() throws Exception {
        mvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                {
                  "type":"EXPENSE",
                  "category":"อาหาร",
                  "amount":100,
                  "occurredAt":"2025-01-01T00:00:00"
                }
                """))
                .andExpect(status().isUnauthorized());
    }
}
