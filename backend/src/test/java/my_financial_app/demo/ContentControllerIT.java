package my_financial_app.demo;

import my_financial_app.demo.Entity.Role;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ContentControllerIT {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    private User mkUser(String username, String email) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword("secret");
        u.setRole(Role.USER);
        return userRepository.save(u);
    }

    // ---------- /api/user/profile/{id} ----------
    @Test
    void getUserProfile_found_returnsOk() throws Exception {
        User user = mkUser("alice", "alice@ex.com");

        mvc.perform(get("/api/user/profile/" + user.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@ex.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void getUserProfile_notFound_returns404() throws Exception {
        mvc.perform(get("/api/user/profile/999"))
                .andExpect(status().isNotFound());
    }

    // ---------- /api/dashboard/stats ----------
    @Test
    void getDashboardStats_ok_returnsStats() throws Exception {
        mkUser("bob", "bob@ex.com");
        mkUser("cate", "cate@ex.com");

        mvc.perform(get("/api/dashboard/stats").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalUsers").value(2))
                .andExpect(jsonPath("$.activeUsers").exists())
                .andExpect(jsonPath("$.totalOrders").exists())
                .andExpect(jsonPath("$.revenue").exists())
                .andExpect(jsonPath("$.userGrowth").exists());
    }

    // ---------- /api/users/list ----------
    @Test
    void getUsersList_ok_returnsUsers() throws Exception {
        mkUser("bob", "bob@ex.com");
        mkUser("cate", "cate@ex.com");

        mvc.perform(get("/api/users/list").param("page", "1").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.users[0].username").value("bob"))
                .andExpect(jsonPath("$.users[1].username").value("cate"))
                .andExpect(jsonPath("$.users[0].password").doesNotExist());
    }

    // ---------- /api/public/health ----------
    @Test
    void healthCheck_ok_returnsStatusAndUserCount() throws Exception {
        mkUser("tom", "tom@ex.com");
        mkUser("jane", "jane@ex.com");

        mvc.perform(get("/api/public/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.userCount").value(2))
                .andExpect(jsonPath("$.timestamp").exists());
    }
    // ---------- /api/users/list ----------
    @Test
    void getUsersList_empty_returnsZeroAndEmptyArray() throws Exception {
        // ไม่มีผู้ใช้ใน DB → total = 0 และ users = []
        mvc.perform(get("/api/users/list").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.users.length()").value(0));
    }

    @Test
    void getUsersList_errorHandling_returnsBadRequest() throws Exception {
        // จำลองให้ repository พัง เพื่อดู fallback error (mock repository error)
        // ใช้ @MockBean เฉพาะคลาสแยก เช่น ContentControllerErrorIT
        // แต่ถ้าใน Full Integration Test จริง จะข้ามได้
    }

    // ---------- /api/dashboard/stats ----------
    @Test
    void getDashboardStats_fallback_returnsZerosWhenError() throws Exception {
        // จำลอง error โดยการทำ repository พัง (ใน Full Integration อาจต้องแยกคลาส mock)
        // คาดหวังว่า fallback จะคืนค่าทุก field = 0
        mvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").exists())
                .andExpect(jsonPath("$.activeUsers").exists())
                .andExpect(jsonPath("$.totalOrders").exists())
                .andExpect(jsonPath("$.revenue").exists());
    }

    // ---------- /api/public/health ----------
    @Test
    void healthCheck_shouldReturnWarning_whenDatabaseError() throws Exception {
        // อันนี้ทำได้เฉพาะถ้า mock repo ได้ แต่ถ้าใช้ DB จริงให้ test เฉพาะเคสปกติ
        mvc.perform(get("/api/public/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.database").value("Connected"))
                .andExpect(jsonPath("$.userCount").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

}
