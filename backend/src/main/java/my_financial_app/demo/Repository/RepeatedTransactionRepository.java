package my_financial_app.demo.Repository;

import my_financial_app.demo.Entity.RepeatedTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RepeatedTransactionRepository extends JpaRepository<RepeatedTransaction, Long> {

    // ค้นหารายการทั้งหมดของ User ที่ Login อยู่
    List<RepeatedTransaction> findByUserId(Long userId);

    // ค้นหารายการเดียว (สำหรับ Update/Delete)
    Optional<RepeatedTransaction> findByIdAndUserId(Long id, Long userId);
}