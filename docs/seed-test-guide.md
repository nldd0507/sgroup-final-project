# Seed & hướng dẫn test thủ công (endpoint #1–14)

## 0. Chuẩn bị

```bash
npm run db:seed   # ⚠ XÓA SẠCH dữ liệu rồi tạo lại — id luôn giống bảng bên dưới
npm run dev       # server ở http://localhost:3000
```

- Mật khẩu chung: `Password123!`
- Seed **reset toàn bộ DB** (TRUNCATE + RESTART IDENTITY), nên id luôn cố định. Muốn chạy lại một block có tạo dữ liệu (Users, Classes), hãy chạy `npm run db:seed` trước.
- Block **Class members** tự dọn sau khi chạy, nên chạy lại bao nhiêu lần cũng được.

---

## 1. Dữ liệu seed

### Users (38)
| id | email | role | Ghi chú |
|---|---|---|---|
| 1–3 | `admin@`, `admin2@`, `admin3@` | ADMIN | |
| 4 | `mentor@` (Mentor Alpha) | MEMBER | mentor lớp 1, 4 |
| 5 | `mentor2@` (Mentor Beta) | MEMBER | mentor lớp 2, **member lớp 1** |
| 6 | `mentor3@` (Mentor Gamma) | MEMBER | mentor lớp 3, 7, **member lớp 5** |
| 7 | `mentor4@` (Mentor Delta) | MEMBER | mentor lớp 5, 8 |
| 8 | `mentor5@` (Mentor Epsilon) | MEMBER | mentor lớp 6 |
| 9 | `member@` (Hoc Vien SGroup) | MEMBER | lớp 1, 2 |
| 10–38 | `member2@` … `member30@` | MEMBER | **id = số + 8** (member2 → 10, member8 → 16) |
| 16 | `member8@` | MEMBER | **không thuộc lớp nào** |
| 38 | `member30@` | MEMBER | **không thuộc lớp nào** |

Email đầy đủ có đuôi `@sgroup.com`.

### Classes (8)
| id | Lớp | Trạng thái | Mentor | Member (id, theo thứ tự `joinedAt`) | Lesson id | Assignment id |
|---|---|---|---|---|---|---|
| 1 | BE Basic - Batch 01 | đang học | 4 | 9, 10, 11, 12, **5**, 17, 18, 19, 20, 21 (**10**) | 1–8 | 1–4 |
| 2 | FE Basic - Batch 01 | đang học | 5 | 9, 13, 14, 22, 23, 24 (**6**) | 9–14 | 5–6 |
| 3 | DevOps Intro - Batch 01 | sắp mở | 6 | 15, 25, 26 (**3**) | — | — |
| 4 | BE Basic - Batch 00 | đã kết thúc | 4 | 14, 27, 28, 29 (**4**) | 15–18 | 7 |
| 5 | Mobile Flutter - Batch 01 | đang học | 7 | 10, 30, 31, 32, 33, **6** (**6**) | 19–23 | 8–9 |
| 6 | Data & SQL - Batch 01 | đang học | 8 | 11, 18, 34, 35, 36 (**5**) | 24–29 | 10–11 |
| 7 | React Advanced - Batch 01 | sắp mở | 6 | 22, 37 (**2**) | — | — |
| 8 | UI/UX Design - Batch 01 | sắp mở | 7 | **(rỗng)** | 30–31 | 12 |

Tổng: 36 lượt tham gia lớp, 31 lesson, 93 lesson_progress, 12 assignment, 33 submission (có cả bài đã chấm và chưa chấm, deadline đã qua và sắp tới).

### Ai thấy lớp nào (`GET /classes`)
| Tài khoản | Thấy lớp |
|---|---|
| admin | 1–8 |
| mentor | 1, 4 |
| mentor2 | 1, 2 |
| mentor3 | 3, 5, 7 |
| member | 1, 2 |
| member7 | 3 |
| member8, member30 | `[]` |

---

## 2. SETUP — dán 1 lần cho mỗi cửa sổ PowerShell

```powershell
$B = "http://localhost:3000"
function api($method, $path, $who, $body) {
  $p = @{ Method = $method; Uri = "$B$path"; UseBasicParsing = $true; Headers = @{} }
  if ($who) { $p.Headers.Authorization = "Bearer $($T[$who])" }
  if ($null -ne $body) { $p.ContentType = "application/json; charset=utf-8"; $p.Body = [Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Compress)) }
  try { $r = Invoke-WebRequest @p; $code = [int]$r.StatusCode; $text = $r.Content }
  catch { if (-not $_.Exception.Response) { throw }; $code = [int]$_.Exception.Response.StatusCode; $text = $_.ErrorDetails.Message }
  $color = if ($code -lt 300) { "Green" } elseif ($code -lt 500) { "Yellow" } else { "Red" }
  $count = ""; try { $j = $text | ConvertFrom-Json; if ($j.data -is [array]) { $count = " ($($j.data.Count) items)" } } catch {}
  Write-Host "[$code] $method $path$count" -ForegroundColor $color
  if ($text) { Write-Host "      $text" }
}
$T = @{ bad = "token-sai" }
foreach ($u in "admin", "mentor", "mentor2", "mentor3", "member", "member7", "member8") {
  $T[$u] = (Invoke-RestMethod -Method Post "$B/auth/login" -ContentType "application/json" -Body (@{ email = "$u@sgroup.com"; password = "Password123!" } | ConvertTo-Json)).data.accessToken
}
"Logged in: $($T.Keys -join ', ')"
```

Cú pháp: `api <METHOD> <path> <ai-gọi> <body>`. Muốn gọi không token thì truyền `$null` vào vị trí người gọi. Comment `#` cuối mỗi dòng là kết quả mong đợi. Màu: xanh = 2xx, vàng = 4xx, đỏ = 5xx (5xx luôn là bug).

---

## 3. Auth (#1–2)

```powershell
api POST /auth/login $null @{ email = "admin@sgroup.com"; password = "Password123!" }   # 200, có accessToken, user.id = 1
api POST /auth/login $null @{ email = "admin@sgroup.com"; password = "SaiMatKhau1" }    # 401 Invalid email or password
api POST /auth/login $null @{ email = "nobody@sgroup.com"; password = "SaiMatKhau1" }   # 401 cùng message (BR-05)
api POST /auth/login $null @{ email = "admin@sgroup.com" }                              # 400 thiếu password
api POST /auth/login $null @{ email = "abc"; password = "Password123!" }                # 400 email sai định dạng
api POST /auth/login $null @{}                                                          # 400
api GET /auth/me member                                                                 # 200, id = 9
api GET /auth/me $null                                                                  # 401
api GET /auth/me bad                                                                    # 401 Token is invalid or expired
```

## 4. Users (#3–6) — chạy sau `npm run db:seed`

```powershell
api GET /users admin                  # 200 (38 items), sắp theo id
api GET /users member                 # 403
api GET /users $null                  # 401
api GET /users/9 admin                # 200 member@sgroup.com
api GET /users/999999 admin           # 404 User not found
api GET /users/abc admin              # 400

api POST /users admin @{ name = "Nguyen Van Moi"; email = "new.user@sgroup.com"; password = "Password123" }   # 201 id = 39, role MEMBER
api POST /users admin @{ name = "Nguyen Van Moi"; email = "new.user@sgroup.com"; password = "Password123" }   # 409 Email already exists
api POST /users admin @{ name = "Nguyen Van Moi"; email = "NEW.USER@sgroup.com"; password = "Password123" }   # 409 (email được lowercase)
api POST /users admin @{ name = "Admin Moi"; email = "new.admin@sgroup.com"; password = "Password123"; role = "ADMIN" }  # 201 id = 40, role ADMIN
api POST /users admin @{ name = "Nguyen Van Moi"; email = "x1@sgroup.com"; password = "123" }                 # 400 password < 8
api POST /users admin @{ name = "A"; email = "x2@sgroup.com"; password = "Password123" }                      # 400 name < 2
api POST /users admin @{ name = "Nguyen Van Moi"; email = "abc"; password = "Password123" }                   # 400 email
api POST /users admin @{ name = "Nguyen Van Moi"; email = "x3@sgroup.com"; password = "Password123"; role = "MENTOR" }  # 400 role
api POST /users member @{ name = "Hacker"; email = "x4@sgroup.com"; password = "Password123" }                # 403
api POST /users $null @{ name = "Hacker"; email = "x5@sgroup.com"; password = "Password123" }                 # 401

api PATCH /users/39 admin @{ name = "Nguyen Van Moi Sua" }   # 200 name đổi
api PATCH /users/39 admin @{ role = "ADMIN" }                # 200 role ADMIN
api PATCH /users/39 admin @{ password = "NewPassword123" }   # 200
api PATCH /users/39 admin @{}                                # 400 At least one field
api PATCH /users/39 admin @{ role = "BOSS" }                 # 400
api PATCH /users/999999 admin @{ name = "Ghost User" }       # 404
api PATCH /users/abc admin @{ name = "Ghost User" }          # 400
api PATCH /users/39 member @{ name = "Hack" }                # 403
```

## 5. Classes (#7–11) — chạy sau `npm run db:seed`

```powershell
api GET /classes admin       # 200 (8 items)
api GET /classes mentor      # 200 (2 items) lớp 1, 4
api GET /classes mentor2     # 200 (2 items) lớp 1, 2
api GET /classes mentor3     # 200 (3 items) lớp 3, 5, 7
api GET /classes member      # 200 (2 items) lớp 1, 2
api GET /classes member8     # 200 (0 items)
api GET /classes $null       # 401

api GET /classes/1 member    # 200, mentor = { id: 4, name: "Mentor Alpha" }
api GET /classes/1 mentor2   # 200 (là member lớp 1)
api GET /classes/2 mentor2   # 200 (là mentor lớp 2)
api GET /classes/8 admin     # 200 lớp rỗng
api GET /classes/1 member8   # 403
api GET /classes/3 member    # 403
api GET /classes/999999 admin   # 404
api GET /classes/abc admin      # 400

api POST /classes admin @{ name = "Test Class Manual"; description = "Tao bang tay"; startDate = "2026-12-01"; endDate = "2027-02-28"; mentorId = 8 }  # 201 id = 9
api POST /classes admin @{ name = "Test Class Bad"; startDate = "2026-12-01"; endDate = "2026-12-01"; mentorId = 8 }        # 400 endDate phải sau startDate
api POST /classes admin @{ name = "Test Class Bad"; startDate = "01/12/2026"; endDate = "2027-02-28"; mentorId = 8 }        # 400 sai định dạng ngày
api POST /classes admin @{ name = "Test Class Bad"; startDate = "2026-12-01"; endDate = "2027-02-28"; mentorId = 999999 }   # 404 Mentor not found
api POST /classes admin @{}                                                                                               # 400
api POST /classes member @{ name = "Test Class Hack"; startDate = "2026-12-01"; endDate = "2027-02-28"; mentorId = 8 }      # 403
api POST /classes $null @{ name = "Test Class Hack"; startDate = "2026-12-01"; endDate = "2027-02-28"; mentorId = 8 }       # 401

api PATCH /classes/9 admin @{ name = "Test Class Renamed"; mentorId = 7 }   # 200 mentorId = 7, startDate giữ nguyên
api PATCH /classes/9 admin @{ endDate = "2026-11-15" }                      # 400 (trước startDate 2026-12-01)
api PATCH /classes/9 admin @{}                                              # 400
api PATCH /classes/9 admin @{ mentorId = 999999 }                           # 404 Mentor not found
api PATCH /classes/999999 admin @{ name = "Ghost Class" }                   # 404 Class not found
api PATCH /classes/1 member @{ name = "Hack" }                              # 403

api DELETE /classes/9 member    # 403
api DELETE /classes/9 admin     # 204
api DELETE /classes/9 admin     # 404 (đã xóa)
api GET /classes/9 admin        # 404
```

## 6. Class members (#12–14) — tự dọn, chạy lại được

```powershell
# ---- #12 GET ----
api GET /classes/1/members admin      # 200 (10 items) memberId: 9,10,11,12,5,17,18,19,20,21
api GET /classes/1/members mentor     # 200 (10 items) mentor của lớp
api GET /classes/2/members mentor2    # 200 (6 items)  mentor2 là mentor lớp 2
api GET /classes/3/members mentor3    # 200 (3 items)
api GET /classes/8/members admin      # 200 (0 items) lớp rỗng
api GET /classes/1/members mentor2    # 403 mentor2 chỉ là member lớp 1
api GET /classes/5/members mentor3    # 403 mentor3 chỉ là member lớp 5
api GET /classes/2/members mentor     # 403 mentor của lớp khác
api GET /classes/1/members member     # 403
api GET /classes/1/members $null      # 401
api GET /classes/999999/members admin # 404 Class not found
api GET /classes/abc/members admin    # 400

# ---- #13 POST ----
api POST /classes/1/members admin @{ memberId = 16 }      # 201 { classId: 1, memberId: 16, joinedAt }
api GET /classes member8                                  # 200 (1 items) member8 giờ thấy lớp 1
api POST /classes/1/members admin @{ memberId = 16 }      # 409 Member already in class (BR-10)
api POST /classes/1/members admin @{ memberId = 9 }       # 409 member@ có sẵn từ seed
api POST /classes/1/members admin @{ memberId = 4 }       # 400 mentor không làm member lớp mình
api POST /classes/2/members admin @{ memberId = 5 }       # 400 mentor2 vào lớp mình dạy
api POST /classes/2/members admin @{ memberId = 4 }       # 201 mentor lớp 1 được học lớp 2
api POST /classes/8/members admin @{ memberId = 38 }      # 201 thành viên đầu tiên của lớp rỗng
api POST /classes/1/members admin @{ memberId = 999999 }  # 404 User not found
api POST /classes/999999/members admin @{ memberId = 16 } # 404 Class not found
api POST /classes/1/members admin @{}                     # 400
api POST /classes/1/members admin @{ memberId = "abc" }   # 400
api POST /classes/1/members admin @{ memberId = -1 }      # 400
api POST /classes/1/members mentor @{ memberId = 38 }     # 403 (BR-09)
api POST /classes/1/members member @{ memberId = 38 }     # 403
api POST /classes/1/members $null @{ memberId = 38 }      # 401

# ---- #14 DELETE ----
api DELETE /classes/1/members/16 mentor      # 403 (BR-09)
api DELETE /classes/1/members/16 member      # 403
api DELETE /classes/1/members/16 $null       # 401
api DELETE /classes/1/members/16 admin       # 204
api DELETE /classes/1/members/16 admin       # 404 Member not in class
api DELETE /classes/2/members/4 admin        # 204
api DELETE /classes/8/members/38 admin       # 204
api DELETE /classes/1/members/15 admin       # 404 member7 không ở lớp 1
api DELETE /classes/999999/members/9 admin   # 404 Class not found
api DELETE /classes/1/members/abc admin      # 400

# ---- Kiểm tra đã về trạng thái seed ----
api GET /classes/1/members admin   # 200 (10 items)
api GET /classes/8/members admin   # 200 (0 items)
api GET /classes member8           # 200 (0 items)
```
