package my_financial_app.demo;

import my_financial_app.demo.Entity.User;
import my_financial_app.demo.Repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;

import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AuthControllerIT {

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void register_then_login_success() {
        // ---------- REGISTER ----------
        Map<String, Object> registerBody = Map.of(
                "username", "alice",
                "password", "123456",
                "email", "alice@example.com"
        );

        ResponseEntity<Map> regRes = rest.exchange(
                "/api/auth/register",
                HttpMethod.POST,
                json(registerBody),
                Map.class
        );

        assertThat(regRes.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(regRes.getBody()).isNotNull();
        assertThat(regRes.getBody().get("success")).isEqualTo(true);
        assertThat(userRepository.existsByUsername("alice")).isTrue();

        // ---------- LOGIN ----------
        Map<String, Object> loginBody = Map.of(
                "username", "alice",
                "password", "123456"
        );

        ResponseEntity<Map> loginRes = rest.exchange(
                "/api/auth/login",
                HttpMethod.POST,
                json(loginBody),
                Map.class
        );

        assertThat(loginRes.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(loginRes.getBody()).isNotNull();
        assertThat(loginRes.getBody().get("success")).isEqualTo(true);


        Map<String, Object> user = (Map<String, Object>) loginRes.getBody().get("user");

        assertThat(user.get("username")).isEqualTo("alice");
        assertThat(user.get("email")).isEqualTo("alice@example.com");

        // ต้องไม่มี field password ใน response
        assertThat(user.keySet()).doesNotContain("password");
    }

    @Test
    void login_fail_when_wrong_password() {
        // สมัครก่อนผ่าน API เพื่อจำลอง flow จริง
        rest.exchange("/api/auth/register", HttpMethod.POST, json(Map.of(
                "username", "bob",
                "password", "Correct#123",
                "email", "bob@example.com"
        )), Map.class);

        // ล็อกอินด้วยรหัสผิด
        ResponseEntity<Map> res = rest.exchange(
                "/api/auth/login",
                HttpMethod.POST,
                json(Map.of("username", "bob", "password", "WrongPass")),
                Map.class
        );

        assertThat(res.getStatusCode().value()).isIn(400, 401, 403);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().get("success")).isEqualTo(false);
    }

    @Test
    void register_duplicate_username_should_fail() {
        // สมัครรายแรกผ่าน API
        rest.exchange("/api/auth/register", HttpMethod.POST, json(Map.of(
                "username", "eve",
                "password", "Pass#123",
                "email", "eve@example.com"
        )), Map.class);

        // สมัครซ้ำ
        ResponseEntity<Map> res = rest.exchange(
                "/api/auth/register",
                HttpMethod.POST,
                json(Map.of(
                        "username", "eve",
                        "password", "Another1!",
                        "email", "eve2@example.com"
                )),
                Map.class
        );

        assertThat(res.getStatusCode().value()).isIn(400, 409);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().get("success")).isEqualTo(false);
        assertThat(res.getBody().get("message").toString().toLowerCase()).contains("username");

        // DB ควรมีผู้ใช้ชื่อ eve แค่ 1 คน
        assertThat(userRepository.findByUsername("eve")).isPresent();
        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    void register_missing_fields_should_return_400() {
        // ลองสมัครโดยไม่มี email
        ResponseEntity<Map> res = rest.exchange(
                "/api/auth/register",
                HttpMethod.POST,
                json(Map.of("username", "no-email", "password", "123456")),
                Map.class
        );

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().get("success")).isEqualTo(false);
    }

    // ---------- Helper ----------
    private static HttpEntity<Map<String, Object>> json(Map<String, Object> body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, h);
    }
}
