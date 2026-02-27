# Foreign Faculty User Guide

## Role Overview

As a Foreign Faculty member, you have access to a focused set of features: inserting student records, viewing your own records, managing parent-teacher conference schedules, and updating your personal settings. You do not have access to FAD execution, statistics, dormitory management, or other administrative functions.

---

## Home Page — Function Navigation

After logging in, you will see the home page with function cards. You have access to the following:

| Card | Description |
|------|-------------|
| **Insert Record** (录入记录) | Add student behavior records |
| **My Records** (我的记录) | View records you have entered |
| **Schedule Management** (日程管理) | Manage parent-teacher conference time slots |

**Cards you will NOT see:** FAD Execution, FAD Delivery, School/Class FAD Statistics, Dormitory Praise Exchange, Dormitory Cleaning, Best Dormitory Ranking, Electronics Violations, Phone List, Interview/Suspension Management, Teaching Ticket Exchange, Data Query

In the top-right corner, click your username to open a dropdown menu:
- **Teacher Info** (教师信息) — View/edit your personal information
- **Change Password** (修改密码) — Change your login password
- **Logout** (退出登录) — Sign out

There is also a **language toggle** button (showing "中文" or "EN") — click to switch between Chinese and English interface.

---

## 1. Insert Record

> Click the **"Insert Record"** (录入记录) card on the home page

This page is used to create student behavior records.

### 1.1 Available Record Types

You can insert the following record types:

| Record Type | Chinese Name | What It Means |
|-------------|-------------|---------------|
| Morning Roll Call Late | 早点名迟到 | Student was late for morning roll call |
| Dormitory Late Exit | 寝室迟出 | Student left the dormitory late |
| Return Violation | 未按规定返校 | Student did not return to school as required |
| Unauthorized Room Entry | 擅自进入会议室或接待室 | Student entered meeting/reception room without permission |
| Dormitory Praise | 寝室表扬 | Positive dormitory behavior recognition |
| Dormitory Warning | 寝室批评 | Negative dormitory behavior warning |
| Dormitory Trash Not Taken Out | 寝室垃圾未倒 | Trash was not taken out in the dormitory |
| Phone Return After 21:30 | 21:30后交还手机(22:00前) | Phone returned late (between 21:30 and 22:00) |
| Phone Return After 22:00 | 22:00后交还手机 | Phone returned very late (after 22:00) — triggers FAD |
| Teaching FAD Ticket | Teaching FAD Ticket | Discipline ticket from teaching |
| Teaching Reward Ticket | Teaching Reward Ticket | Reward ticket from teaching |

**You CANNOT insert:** FAD, Reward, or Online Class Electronic Device Violation (admin-only types)

### 1.2 Step-by-Step Instructions

1. **Select Record Type**: Choose from the "Record Type" (记录类型) dropdown
2. **Select Semester**: Choose from the "Semester" (学期) dropdown (defaults to current semester)
3. **Select Student(s)**:
   - **For dormitory records** (Dormitory Late Exit, Praise, Warning, Trash Not Taken Out):
     - First select the dorm number from the "Dormitory" (寝室) dropdown
     - Then select students from the "Dormitory Students" (寝室学生) dropdown (students from that dorm are auto-loaded)
   - **For all other records**:
     - Type the student's name in the "Student" (学生) search box
     - Select from the dropdown results (you can select multiple students)
4. **Select Date**: Use the "Record Date" (记录日期) date picker (defaults to today)
5. **Enter Reason**: Type in the "Record Reason" (记录事由) text box
   - **Required** for: Teaching FAD Ticket, Teaching Reward Ticket
   - Optional for other record types
6. Click the **"Submit"** (提交) button

Selected students appear as tags below the selection field. Click the **×** on any tag to remove that student. Click **"Reset"** (重置) to clear the entire form.

### 1.3 Special Fields

| Record Type | Extra Field | How to Use |
|-------------|------------|------------|
| Teaching FAD Ticket | **Ticket Quantity** (票据数量) dropdown | Select 1–6 tickets to insert at once for the same student |
| Teaching Reward Ticket | **Ticket Quantity** (票据数量) dropdown | Select 1–6 tickets to insert at once for the same student |

### 1.4 Accumulation Rules

After you submit a record, the system automatically checks the student's total record count for that type. When thresholds are reached, a notification popup will appear:

| Record Type | Threshold | What Happens |
|-------------|-----------|-------------|
| Morning Roll Call Late | 2 times | Auto-generates a FAD record |
| Dormitory Late Exit | 2 times | Auto-generates a FAD record |
| Return Violation | 2 times | Auto-generates a FAD record |
| Unauthorized Room Entry | 2 times | Auto-generates a FAD record |
| Dormitory Warning | 5 times | Auto-generates a FAD record |
| Dormitory Trash Not Taken Out | 2 times | Auto-generates a Dormitory Warning (which can chain to FAD at 5 warnings) |
| Teaching FAD Ticket | 3 tickets | Auto-generates a FAD record |
| Phone Return After 22:00 | Every time | **Immediately** generates a FAD record |
| Dormitory Praise | 10 times | Notification: eligible for Reward exchange (an admin must process this) |
| Teaching Reward Ticket | 6 tickets | Notification: eligible for Reward exchange (an admin must process this) |

> **Important:** Phone Return After 21:30 (before 22:00) does NOT trigger a FAD. Only Phone Return After 22:00 triggers an immediate FAD.

### 1.5 Submission Results

- **All successful**: A green success message appears, listing any accumulated FAD/warnings generated
- **Partial failure**: An orange message explains which students failed (e.g., duplicate dormitory praise/warning/trash for the same student on the same day is rejected)
- **All failed**: A red error message appears

> **Duplicate Prevention:** Dormitory Praise, Dormitory Warning, and Dormitory Trash Not Taken Out **cannot be recorded twice for the same student on the same day**. The system will reject duplicates.

---

## 2. My Records

> Click the **"My Records"** (我的记录) card on the home page

This page lets you view, filter, export, and withdraw records you have entered.

### 2.1 Filter Bar

The top of the page has a row of filter controls:

| Filter | Type | Description |
|--------|------|-------------|
| **Record Type** (记录类型) | Dropdown | Select a record type to filter; list refreshes automatically |
| **FAD Source Type** (FAD来源类型) | Dropdown | Only appears when viewing FAD records |
| **Semester** (学期) | Dropdown | Filter by semester |
| **Student Name** (学生姓名) | Text input | Type a name to search |
| **Class** (班级) | Dropdown (searchable) | Filter by class |
| **Date Range** (记录日期范围) | Date range picker | Select start and end dates |
| **Export CSV** (导出CSV) | Green button | Download filtered results as a CSV file |

> Note: You will only see records that **you** entered. You cannot view records entered by other teachers.

### 2.2 Status Tags

Each record has a colored status tag:

| Record Type | Tag | Color | Meaning |
|-------------|-----|-------|---------|
| FAD | Offset Done (已冲销) | Green | Reward has offset this FAD |
| FAD | Executed Not Offset (已执行未冲销) | Orange | FAD was executed but not offset |
| FAD | Not Executed (未执行) | Red | FAD has not been executed yet |
| Dormitory Warning | Accumulated FAD (已累计FAD) | Red | This warning triggered a FAD |
| Dormitory Warning | Not Accumulated (未累计FAD) | Blue | Threshold not yet reached |
| Dormitory Praise | Accumulated Reward (已累计Reward) | Red | This praise was used in Reward exchange |
| Dormitory Praise | Not Accumulated (未累计Reward) | Blue | Not yet exchanged |
| Dormitory Trash | Accumulated Warning (已累计批评) | Red | Triggered a dormitory warning |
| Dormitory Trash | Not Accumulated (未累计批评) | Blue | Threshold not yet reached |
| Other | Valid (有效) | Blue | Record is active |

### 2.3 Withdrawing a Record

Click the **"Withdraw"** (撤回) button next to a record:

1. A confirmation dialog appears with an orange warning at the top
2. If this record triggered any cascading records (e.g., a FAD or Dormitory Warning was auto-generated from it), those **cascade records** will be listed — they will also be deleted
3. Enter a reason in the **"Withdraw Reason"** (撤回原因) text box (required)
4. Click the red **"Confirm Withdraw"** (确认撤回) button

**When the Withdraw button is grayed out** (hover to see reason):

| Situation | Message |
|-----------|---------|
| Reward records | Reward records cannot be withdrawn |
| Delivered FAD | Delivered FAD cannot be withdrawn |
| Executed FAD | Executed FAD cannot be withdrawn |
| Offset FAD | Offset FAD cannot be withdrawn |
| Delivered records | Delivered records cannot be withdrawn |
| Dormitory Praise with Reward exchanged | Cannot withdraw praise that was exchanged for Reward |
| Teaching Ticket with Reward exchanged | Cannot withdraw ticket that was exchanged for Reward |
| Records entered by admin | You can only withdraw your own records |

### 2.4 Pagination

At the bottom of the list, you can choose to display 10 / 20 / 50 / 100 records per page.

---

## 3. Schedule Management

> Click the **"Schedule Management"** (日程管理) card on the home page

This feature lets you create and manage time slots for parent-teacher conferences.

### 3.1 Creating Conference Time Slots

The top section has a form for batch-creating time slots:

1. **Select Dates** (选择日期): Click the date picker to choose one or more dates. Past dates are blocked and cannot be selected.

2. **Morning Session** (上午时段): Check the box to enable, then set:
   - **Start time** (开始) — e.g., 08:00
   - **End time** (结束) — e.g., 12:00

3. **Afternoon Session** (下午时段): Check the box to enable, then set start and end times.

4. **Time Split** (时间分割): Select the duration of each time slot:
   - **10 min** / **15 min** / **20 min** / **30 min**

5. **Location** (地点) — **Required**: Choose from the dropdown:
   - **In-person** (线下)
   - **Tencent Meeting** (腾讯会议)

6. **Note** (备注): Optional text field for additional information.

7. Click **"Create Sessions"** (创建时段) to generate all time slots at once.

> **Conflict Detection:** If any new time slot overlaps with an existing one, an error message will appear listing the conflicts. You must resolve the conflicts before creating.

Click **"Clear"** (清空) to reset the form.

### 3.2 Managing Your Time Slots

The bottom section shows all your created time slots in a table:

| Column | Description |
|--------|-------------|
| Date (日期) | The date of the time slot |
| Start (开始) | Start time |
| End (结束) | End time |
| Location (地点) | In-person or Tencent Meeting |
| Booking Status (预约情况) | Shows "current / max" bookings. Green if someone has booked. |
| Operation (操作) | Delete button or "Has Booking" tag |

**Actions:**
- **Unbooked slots**: Click the red **"Delete"** (删除) button → Confirmation dialog → **"Confirm"** (确认)
- **Booked slots**: Show a gray **"Has Booking"** (已有预约) tag — you cannot delete these
- **Batch delete**: Click **"Delete All Unbooked"** (删除全部未预约) at the bottom → **Warning: this action cannot be undone!**

### 3.3 My Schedule

Click the **"My Schedule"** (我的日程) button at the top of the page to view a calendar showing your upcoming appointments and booked parent details.

---

## 4. Settings

### Change Password

> Click your username (top-right) → **"Change Password"** (修改密码)

1. Enter your **Current Password** (当前密码)
2. Enter your **New Password** (新密码) — minimum 6 characters
3. Enter **Confirm New Password** (确认新密码) — must match exactly
4. Click **"Confirm Change"** (确认修改)

After a successful change, you will be automatically logged out and redirected to the login page. Use your new password to log in.

> **Validation:** If the two new passwords don't match, you'll see an error: "The two passwords do not match" (两次输入的密码不一致)

### Teacher Info

> Click your username (top-right) → **"Teacher Info"** (教师信息)

View and edit your personal teacher profile information.

---

## Important Notes

1. **You cannot execute or deliver FAD/Reward** — these are admin functions. Contact an administrator if needed.
2. **You can only withdraw records you personally entered.** Records entered by administrators cannot be withdrawn by you.
3. **Dormitory Praise** reaching 10 counts can be exchanged for a Reward, but only an administrator can process the exchange.
4. **Teaching Reward Tickets** reaching 6 counts can be exchanged for a Reward — also requires an administrator.
5. **Withdrawing a record will cascade-delete** any FAD or Dormitory Warning that was auto-generated from the accumulated records.
6. **Duplicate prevention**: Dormitory Praise, Warning, and Trash Not Taken Out cannot be recorded for the same student on the same day.
7. **Language switching**: Use the language toggle in the top-right corner to switch between Chinese (中文) and English (EN). The page will reload to apply the change.
