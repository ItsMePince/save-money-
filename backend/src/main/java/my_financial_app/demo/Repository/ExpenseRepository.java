package my_financial_app.demo.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import my_financial_app.demo.Entity.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserIdOrderByOccurredAtDesc(Long userId);

    List<Expense> findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(
            Long userId, LocalDateTime start, LocalDateTime end
    );

    java.util.Optional<Expense> findByIdAndUserId(Long id, Long userId);
}
