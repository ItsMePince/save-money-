package my_financial_app.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import my_financial_app.demo.Controller.AuthController;
import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(AuthController.class)
class  AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    @MockBean UserRepository userRepository;

    private String toJson(Object o) throws Exception { return om.writeValueAsString(o); }

    // ---------- helper ----------
    private User mkUser(Long id, String username, String email, String password) {
        User u = new User();
        try {
            Field f = User.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(u, id);
        } catch (Exception ignore) {}
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword(password);
        return u;
    }

    // ---------- /api/auth/login ----------
    @Test
    void login_success_setsSession_andReturnsUser() throws Exception {
        User user = mkUser(1L, "ken", "ken@example.com", "pass123");

        Mockito.when(userRepository.findByUsernameOrEmail("ken","ken")).thenReturn(Optional.of(user));
        Mockito.when(userRepository.save(ArgumentMatchers.any(User.class))).thenReturn(user);

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","ken","password","pass123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.username").value("ken"))
                .andExpect(request().sessionAttribute("username", "ken"));
    }

    @Test
    void login_badRequest_whenBlankUsernameOrPassword() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","   ","password","x"))))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","ken","password","   "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_badRequest_whenUserNotFound() throws Exception {
        Mockito.when(userRepository.findByUsernameOrEmail("unknown","unknown"))
                .thenReturn(Optional.empty());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","unknown","password","whatever"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_badRequest_whenWrongPassword() throws Exception {
        User user = mkUser(2L, "ken", "ken@example.com", "secret");

        Mockito.when(userRepository.findByUsernameOrEmail("ken","ken"))
                .thenReturn(Optional.of(user));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","ken","password","wrong"))))
                .andExpect(status().isBadRequest());
    }

    // ---------- /api/auth/register ----------
    @Test
    void register_success() throws Exception {
        Mockito.when(userRepository.existsByUsername("newuser")).thenReturn(false);
        Mockito.when(userRepository.existsByEmail("new@ex.com")).thenReturn(false);

        User saved = mkUser(10L,"newuser","new@ex.com","pass123");
        Mockito.when(userRepository.save(ArgumentMatchers.any(User.class))).thenReturn(saved);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","newuser","email","new@ex.com","password","pass123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.id").value(10));
    }

    @Test
    void register_badRequest_whenMissingFields() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","","email","x@x.com","password","pass123"))))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","u","email","","password","pass123"))))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","u","email","x@x.com","password",""))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_badRequest_whenPasswordTooShort() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","u","email","x@x.com","password","123"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_badRequest_whenUsernameExists_orEmailExists() throws Exception {
        Mockito.when(userRepository.existsByUsername("dup")).thenReturn(true);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","dup","email","dup@ex.com","password","pass123"))))
                .andExpect(status().isBadRequest());

        Mockito.reset(userRepository);
        Mockito.when(userRepository.existsByUsername("ok")).thenReturn(false);
        Mockito.when(userRepository.existsByEmail("dup@ex.com")).thenReturn(true);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","ok","email","dup@ex.com","password","pass123"))))
                .andExpect(status().isBadRequest());
    }

    // ---------- /api/auth/signup ----------
    @Test
    void signup_worksSameAsRegister() throws Exception {
        Mockito.when(userRepository.existsByUsername("x")).thenReturn(false);
        Mockito.when(userRepository.existsByEmail("x@ex.com")).thenReturn(false);

        User saved = mkUser(11L,"x","x@ex.com","pass123");
        Mockito.when(userRepository.save(ArgumentMatchers.any(User.class))).thenReturn(saved);

        mvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("username","x","email","x@ex.com","password","pass123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("x"));
    }

    // ---------- /api/auth/logout ----------
    @Test
    void logout_invalidatesSession_andReturnsOk() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("username", "ken");

        mvc.perform(post("/api/auth/logout").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value("true"));
    }

    // ---------- /api/auth/user/{id} ----------
    @Test
    void getUser_found_returnsProfile() throws Exception {
        User user = mkUser(5L,"ken","ken@ex.com","pass");

        Mockito.when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        mvc.perform(get("/api/auth/user/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.username").value("ken"));
    }

    @Test
    void getUser_notFound_returns404() throws Exception {
        Mockito.when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/auth/user/999"))
                .andExpect(status().isNotFound());
    }
}
