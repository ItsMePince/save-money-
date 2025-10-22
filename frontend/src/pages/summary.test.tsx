// src/pages/SignUp.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SignUp from "./SignUp";

// -------- helpers --------
function typeIntoForm({
  email = "me@example.com",
  username = "me",
  password = "secret6",
}: { email?: string; username?: string; password?: string }) {
  if (email !== undefined) {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  }
  if (username !== undefined) {
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: username } });
  }
  if (password !== undefined) {
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  }
}

function mockFetchOnce(data: any, ok = true) {
  (globalThis.fetch as any) = vi.fn().mockResolvedValueOnce({
    ok,
    json: async () => data,
  } as Response);
}

describe("SignUp (Frontend only)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window.localStorage.__proto__, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("เรนเดอร์ฟอร์มได้ครบและมีลิงก์ Login", () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: /login/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("validate: ต้องกรอกข้อมูลให้ครบถ้วน", async () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/กรุณากรอกข้อมูลให้ครบถ้วน/i)).toBeInTheDocument();
  });

  it("validate: รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร", async () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    typeIntoForm({ email: "a@b.com", username: "abc", password: "12345" });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร/i)).toBeInTheDocument();
  });

  it("เมื่อเริ่มพิมพ์ใหม่แล้ว error เดิมถูกล้าง", async () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/กรุณากรอกข้อมูลให้ครบถ้วน/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "me@x.com" } });
    expect(screen.queryByText(/กรุณากรอกข้อมูลให้ครบถ้วน/i)).not.toBeInTheDocument();
  });

  it("loading: ปุ่มและช่องกรอกถูก disabled ระหว่างส่งข้อมูล", async () => {
    mockFetchOnce({ success: false, message: "x" });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    typeIntoForm({});
    const submit = screen.getByRole("button", { name: /create account/i });

    fireEvent.click(submit);
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent(/กำลังสมัครสมาชิก/i);

    await waitFor(() => {
      expect(submit).not.toBeDisabled();
      expect(submit).toHaveTextContent(/create account/i);
    });
  });

  it("เส้นทาง onSubmit prop: เรียก callback ด้วยค่าฟอร์ม และไม่เรียก fetch", async () => {
    const onSubmit = vi.fn();
    (globalThis.fetch as any) = vi.fn();

    render(
      <MemoryRouter>
        <SignUp onSubmit={onSubmit} />
      </MemoryRouter>
    );

    typeIntoForm({ email: "me@x.com", username: "me", password: "secret6" });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "me@x.com",
        username: "me",
        password: "secret6",
      });
    });

    expect(globalThis.fetch as any).not.toHaveBeenCalled();
  });

  it("เรียก fetch ด้วยพารามิเตอร์ที่ถูกต้องเมื่อไม่มี onSubmit prop", async () => {
    mockFetchOnce({ success: false, message: "x" });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    typeIntoForm({ email: "a@b.com", username: "abc", password: "secret6" });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(globalThis.fetch as any).toHaveBeenCalled());

    const fetchMock = globalThis.fetch as unknown as { mock: { calls: any[] } };
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8081/api/auth/signup");
    expect(init.method).toBe("POST");

    const contentType = new Headers(init.headers as HeadersInit).get("Content-Type");
    expect(contentType).toBe("application/json");

    const bodyObj = JSON.parse(String(init.body));
    expect(bodyObj).toEqual({
      email: "a@b.com",
      username: "abc",
      password: "secret6",
    });
  });

  it("API success: เก็บ user ใน localStorage และเรียก onSignUpSuccess", async () => {
    const fakeUser = { username: "me", email: "me@x.com", role: "member" };
    mockFetchOnce({ success: true, user: fakeUser });
    const onSignUpSuccess = vi.fn();

    render(
      <MemoryRouter>
        <SignUp onSignUpSuccess={onSignUpSuccess} />
      </MemoryRouter>
    );

    typeIntoForm({});
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(fakeUser));
      expect(onSignUpSuccess).toHaveBeenCalledWith(fakeUser);
    });
  });

  it("API success (ไม่มี onSignUpSuccess): redirect ไป /Home", async () => {
    const fakeUser = { username: "me", email: "me@x.com", role: "member" };
    mockFetchOnce({ success: true, user: fakeUser });

    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, href: "" },
      writable: true,
    });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    typeIntoForm({});
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(window.location.href).toBe("/Home");
    });

    Object.defineProperty(window, "location", { value: originalLocation });
  });

  it("API error: แสดงข้อความจาก server", async () => {
    mockFetchOnce({ success: false, message: "อีเมลนี้มีผู้ใช้งานแล้ว" });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    typeIntoForm({});
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/อีเมลนี้มีผู้ใช้งานแล้ว/i)).toBeInTheDocument();
  });

  it("API error (ไม่มี message): ใช้ fallback 'การสมัครสมาชิกล้มเหลว'", async () => {
    mockFetchOnce({ success: false });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    typeIntoForm({});
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/การสมัครสมาชิกล้มเหลว/i)).toBeInTheDocument();
  });

  it("Network error: แสดงข้อความภาษาไทยตามที่กำหนด", async () => {
    (globalThis.fetch as any) = vi.fn().mockRejectedValueOnce(new Error("Network down"));

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    typeIntoForm({});
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง/i)
    ).toBeInTheDocument();
  });
});
