package my_financial_app.demo.Controller;

// DTO: ใช้รับข้อมูล JSON จาก Frontend
public class RepeatedTransactionRequest {
    public String name;
    public String account;
    public Double amount; // รับเป็น Double ก่อน
    public String date;
    public String frequency;
}