package my_financial_app.demo.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import my_financial_app.demo.Entity.Account;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserIdOrderByIdDesc(Long userId);
    Optional<Account> findByIdAndUserId(Long id, Long userId);
}
