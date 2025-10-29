package my_financial_app.demo.Controller;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateExpenseRequest {
    @NotBlank public String type;
    @NotBlank public String category;
    @NotNull  public Double amount;
    public String note;
    @NotBlank public String place;

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime occurredAt;

    @NotBlank public String paymentMethod;
    public String iconKey;
}
