package my_financial_app.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import my_financial_app.demo.Controller.ContentController;
import my_financial_app.demo.Entity.Role;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(ContentController.class)
class ContentControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    @MockBean UserRepository userRepository;

    // -------- helper: set field via reflection (id / role) --------
    private User mkUser(Long id, String username, String email) {
        User u = new User();
        try {
            Field fid = User.class.getDeclaredField("id");
            fid.setAccessible(true);
            fid.set(u, id);
        } catch (Exception ignore) {}
        try {
            Field frole = User.class.getDeclaredField("role");
            frole.setAccessible(true);
            frole.set(u, Role.USER);
        } catch (Exception ignore) {}
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword("secret");
        return u;
    }

    // ---------- GET /api/user/profile/{id} ----------
    @Test
    void getUserProfile_found_returnsOk() throws Exception {
        var user = mkUser(5L, "alice", "alice@ex.com");
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        mvc.perform(get("/api/user/profile/5"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@ex.com"));

        verify(userRepository).findById(5L);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void getUserProfile_notFound_returns404() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/user/profile/999"))
                .andExpect(status().isNotFound())
                // 404 จาก notFound().build() จะไม่มี Content-Type/ไม่มี body
                // ถ้าอยากเช็กเพิ่มสามารถเช็กว่า body ว่าง:
                .andExpect(content().string(""));

        verify(userRepository).findById(999L);
        verifyNoMoreInteractions(userRepository);
    }


    // ---------- GET /api/dashboard/stats ----------
    @Test
    void getDashboardStats_ok_includesKeyNumbers() throws Exception {
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countActiveUsersToday()).thenReturn(7L);

        mvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalUsers").value(100))
                .andExpect(jsonPath("$.activeUsers").value(7))
                .andExpect(jsonPath("$.totalOrders").exists())
                .andExpect(jsonPath("$.revenue").exists())
                .andExpect(jsonPath("$.userGrowth").exists());

        verify(userRepository).count();
        verify(userRepository).countActiveUsersToday();
        verifyNoMoreInteractions(userRepository);
    }

    // ---------- GET /api/users/list ----------
    @Test
    void getUsersList_ok_returnsUsersAndPagingEcho() throws Exception {
        var u1 = mkUser(1L, "bob", "bob@ex.com");
        var u2 = mkUser(2L, "cate", "cate@ex.com");
        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        mvc.perform(get("/api/users/list")
                        .param("page", "2")
                        .param("size", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.users[0].id").value(1))
                .andExpect(jsonPath("$.users[0].username").value("bob"))
                .andExpect(jsonPath("$.users[1].id").value(2))
                .andExpect(jsonPath("$.users[1].username").value("cate"));

        verify(userRepository).findAll();
        verifyNoMoreInteractions(userRepository);
    }

    // ---------- GET /api/public/health ----------
    @Test
    void healthCheck_ok_returnsStatusAndUserCount() throws Exception {
        when(userRepository.count()).thenReturn(42L);

        mvc.perform(get("/api/public/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.userCount").value(42))
                .andExpect(jsonPath("$.timestamp").exists());

        verify(userRepository).count();
        verifyNoMoreInteractions(userRepository);
    }
}
