package my_financial_app.demo.Controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateAccountRequest {
    @NotBlank public String name;
    @NotBlank public String type;   // "เงินสด" | "ธนาคาร" | "บัตรเครดิต" หรือ "cash"|"bank"|"credit_card"
    @NotNull  public Double amount;
    public String iconKey;
}
