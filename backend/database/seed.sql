-- SafeReach MySQL Complete Seed Data
-- Populates all 28 tables with comprehensive sample data for development & phpMyAdmin viewing

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Roles
INSERT INTO roles (id, role_key, name, description) VALUES
('r-main-admin', 'main_admin', 'Main Admin', 'SafeReach Platform Owner and Master Administrator'),
('r-school-admin', 'school_admin', 'School Administrator', 'School Principal and Administrative Staff'),
('r-teacher', 'teacher', 'Class Incharge', 'Class Incharge Teacher with attendance and marks privileges'),
('r-assistant-incharge', 'assistant_incharge', 'Assistant Incharge', 'Assistant Teacher for assigned classrooms'),
('r-parent', 'parent', 'Parent / Guardian', 'Parent with child monitoring and messaging access')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- 2. Permissions
INSERT INTO permissions (id, permission_key, description) VALUES
('p-01', 'app.main_admin.school.accept', 'Accept school registration requests'),
('p-02', 'app.main_admin.school.reject', 'Reject school registration requests'),
('p-03', 'app.admin.student.add', 'Add student records'),
('p-04', 'app.admin.student.edit', 'Edit student records'),
('p-05', 'app.admin.student.delete', 'Delete student records'),
('p-06', 'app.admin.student.move_next_standard', 'Move existing student to next standard'),
('p-07', 'app.admin.teacher.create', 'Create teacher accounts'),
('p-08', 'app.admin.teacher.assign_incharge', 'Assign primary and assistant incharge'),
('p-09', 'app.teacher.student.edit_assigned', 'Edit assigned class students'),
('p-10', 'app.teacher.attendance.submit', 'Submit attendance'),
('p-11', 'app.teacher.go_out.submit', 'Submit go-out attendance'),
('p-12', 'app.teacher.results.enter', 'Enter assigned class student results'),
('p-13', 'app.admin.results.configure', 'Configure result exams and mark limits'),
('p-14', 'app.parent.child.ready_to_school', 'Mark child ready for school'),
('p-15', 'app.parent.child.reached_home', 'Confirm child reached home'),
('p-16', 'app.timetable.edit', 'Edit timetable subjects and break timing'),
('p-17', 'app.notification.read', 'Read allowed notifications')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 3. Role Permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
('r-main-admin', 'p-01'), ('r-main-admin', 'p-02'), ('r-main-admin', 'p-03'), ('r-main-admin', 'p-04'), ('r-main-admin', 'p-05'),
('r-main-admin', 'p-06'), ('r-main-admin', 'p-07'), ('r-main-admin', 'p-08'), ('r-main-admin', 'p-09'), ('r-main-admin', 'p-10'),
('r-main-admin', 'p-11'), ('r-main-admin', 'p-12'), ('r-main-admin', 'p-13'), ('r-main-admin', 'p-14'), ('r-main-admin', 'p-15'),
('r-main-admin', 'p-16'), ('r-main-admin', 'p-17'),
('r-school-admin', 'p-03'), ('r-school-admin', 'p-04'), ('r-school-admin', 'p-05'), ('r-school-admin', 'p-06'), ('r-school-admin', 'p-07'),
('r-school-admin', 'p-08'), ('r-school-admin', 'p-13'), ('r-school-admin', 'p-16'), ('r-school-admin', 'p-17'),
('r-teacher', 'p-09'), ('r-teacher', 'p-10'), ('r-teacher', 'p-11'), ('r-teacher', 'p-12'), ('r-teacher', 'p-16'), ('r-teacher', 'p-17'),
('r-assistant-incharge', 'p-09'), ('r-assistant-incharge', 'p-10'), ('r-assistant-incharge', 'p-11'), ('r-assistant-incharge', 'p-12'), ('r-assistant-incharge', 'p-16'), ('r-assistant-incharge', 'p-17'),
('r-parent', 'p-14'), ('r-parent', 'p-15'), ('r-parent', 'p-17');

-- 4. Schools
INSERT INTO schools (id, name, code, address, city, state, country, phone, email, status, school_open_time, school_close_time) VALUES
('sch-001', 'SafeReach Academy', 'SAFE-ACADEMY-01', '12 Knowledge Park', 'Chennai', 'Tamil Nadu', 'India', '+91 98765 43210', 'admin@safereach.school', 'active', '08:00:00', '16:30:00'),
('sch-002', 'Greenwood International', 'GREEN-INTL-02', '45 Hilltop Avenue', 'Bangalore', 'Karnataka', 'India', '+91 98765 43211', 'admin@greenwood.school', 'active', '08:15:00', '16:00:00'),
('sch-003', 'St. Xavier Public School', 'ST-XAVIER-03', '88 Cathedral Road', 'Mumbai', 'Maharashtra', 'India', '+91 98765 43212', 'contact@stxavier.edu', 'active', '07:45:00', '15:30:00')
ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status);

-- 5. Users (Hashed Passwords: MainAdmin@2025, Admin@2025, Teacher@2025, Parent@2025)
INSERT INTO users (id, school_id, role_id, full_name, email, phone, password_hash, status, terms_accepted_at) VALUES
('u-main-01', NULL, 'r-main-admin', 'SafeReach Platform Owner', 'main@safereach.local', '+91 98765 00000', '$2y$10$a7zqAnEMTgaT23EUbpKMMe/vw4smvKAJcEWJzwGNyPkHPQLRx0Nuq', 'active', NOW()),
('u-main-02', NULL, 'r-main-admin', 'Platform Administrator', 'mainadmin@demo.safereach.edu', '+91 98765 00001', '$2y$10$a7zqAnEMTgaT23EUbpKMMe/vw4smvKAJcEWJzwGNyPkHPQLRx0Nuq', 'active', NOW()),
('u-admin-01', 'sch-001', 'r-school-admin', 'Priya Raman', 'admin@safereach.school', '+91 98765 43210', '$2y$10$lW5bqKBC8j37TM3imnySsuIp5ZnNl.CBAaEkkphH8xpFiijZpuOqu', 'active', NOW()),
('u-admin-02', 'sch-001', 'r-school-admin', 'Priya Raman', 'admin@demo.safereach.edu', '+91 98765 43210', '$2y$10$lW5bqKBC8j37TM3imnySsuIp5ZnNl.CBAaEkkphH8xpFiijZpuOqu', 'active', NOW()),
('u-teach-01', 'sch-001', 'r-teacher', 'Sarah Jenkins', 'teacher@demo.safereach.edu', '+91 98765 11111', '$2y$10$LF6gDzIXTIz82PxhNdJjx.an4hsuxHz/kopDMDr7xTLMSUb9it0XG', 'active', NOW()),
('u-teach-02', 'sch-001', 'r-assistant-incharge', 'James Anderson', 'james.anderson@safereach.school', '+91 98765 11112', '$2y$10$CkjOvopjaElxrf3o1G5dLOOhFcrZXBT0vlnI25hR/b2VCY4Uktum2', 'active', NOW()),
('u-teach-03', 'sch-001', 'r-teacher', 'Elena Roy', 'elena.roy@safereach.school', '+91 98765 11113', '$2y$10$LF6gDzIXTIz82PxhNdJjx.an4hsuxHz/kopDMDr7xTLMSUb9it0XG', 'active', NOW()),
('u-teach-04', 'sch-001', 'r-assistant-incharge', 'David Kumar', 'david.kumar@safereach.school', '+91 98765 11114', '$2y$10$CkjOvopjaElxrf3o1G5dLOOhFcrZXBT0vlnI25hR/b2VCY4Uktum2', 'active', NOW()),
('u-teach-05', 'sch-001', 'r-teacher', 'Priya Nair', 'priya.nair@safereach.school', '+91 98765 11115', '$2y$10$LF6gDzIXTIz82PxhNdJjx.an4hsuxHz/kopDMDr7xTLMSUb9it0XG', 'active', NOW()),
('u-parent-01', 'sch-001', 'r-parent', 'Sarah Thompson', 'parent@demo.safereach.edu', '+91 98765 22221', '$2y$10$/c0jBYUoplP95bHwvsEv3evsTUTVHHR0d8.rwT/2v1A5vrpW1rL4K', 'active', NOW()),
('u-parent-02', 'sch-001', 'r-parent', 'Nisha Sharma', 'parent02@safereach.school', '+91 98765 22222', '$2y$10$/c0jBYUoplP95bHwvsEv3evsTUTVHHR0d8.rwT/2v1A5vrpW1rL4K', 'active', NOW()),
('u-parent-03', 'sch-001', 'r-parent', 'Ravi Patel', 'parent03@safereach.school', '+91 98765 22223', '$2y$10$/c0jBYUoplP95bHwvsEv3evsTUTVHHR0d8.rwT/2v1A5vrpW1rL4K', 'active', NOW())
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash);

-- 6. School Registration Requests
INSERT INTO school_registration_requests (id, school_name, requester_name, requester_email, requester_phone, address, password_hash, status, created_at) VALUES
('srr-001', 'Oakridge International Academy', 'Dr. Alok Verma', 'principal@oakridge.edu', '+91 98111 22334', 'Sector 14, Gurugram', '$2y$10$lW5bqKBC8j37TM3imnySsuIp5ZnNl.CBAaEkkphH8xpFiijZpuOqu', 'pending', NOW()),
('srr-002', 'Delhi Heritage Public School', 'Sunita Rao', 'admin@delhiheritage.edu', '+91 98222 33445', 'Rohini Sector 9, New Delhi', '$2y$10$lW5bqKBC8j37TM3imnySsuIp5ZnNl.CBAaEkkphH8xpFiijZpuOqu', 'pending', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 7. Classes
INSERT INTO classes (id, school_id, name, sort_order) VALUES
('cls-04', 'sch-001', 'Class 4', 4),
('cls-05', 'sch-001', 'Class 5', 5),
('cls-06', 'sch-001', 'Class 6', 6),
('cls-07', 'sch-001', 'Class 7', 7),
('cls-08', 'sch-001', 'Class 8', 8)
ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order);

-- 8. Sections
INSERT INTO sections (id, school_id, class_id, name, room) VALUES
('sec-04a', 'sch-001', 'cls-04', 'A', 'Room 4A'),
('sec-04b', 'sch-001', 'cls-04', 'B', 'Room 4B'),
('sec-05a', 'sch-001', 'cls-05', 'A', 'Room 5A'),
('sec-06a', 'sch-001', 'cls-06', 'A', 'Room 6A'),
('sec-07a', 'sch-001', 'cls-07', 'A', 'Room 7A'),
('sec-08a', 'sch-001', 'cls-08', 'A', 'Room 8A')
ON DUPLICATE KEY UPDATE room=VALUES(room);

-- 9. Teachers
INSERT INTO teachers (id, school_id, user_id, employee_code, subject, qualification, status) VALUES
('t-01', 'sch-001', 'u-teach-01', 'T-01P', 'English', 'M.A., B.Ed', 'available'),
('t-02', 'sch-001', 'u-teach-02', 'T-01A', 'Mathematics', 'M.Sc., B.Ed', 'available'),
('t-03', 'sch-001', 'u-teach-03', 'T-02P', 'Science', 'M.Sc., B.Ed', 'available'),
('t-04', 'sch-001', 'u-teach-04', 'T-02A', 'Social Studies', 'M.A., B.Ed', 'available'),
('t-05', 'sch-001', 'u-teach-05', 'T-03P', 'Computer', 'B.Tech / MCA', 'available')
ON DUPLICATE KEY UPDATE subject=VALUES(subject), status=VALUES(status);

-- 10. Teacher Assignments
INSERT INTO teacher_assignments (id, school_id, teacher_id, class_id, section_id, assignment_type, subject, active) VALUES
('ta-01', 'sch-001', 't-01', 'cls-04', 'sec-04a', 'primary_incharge', 'English', TRUE),
('ta-02', 'sch-001', 't-02', 'cls-04', 'sec-04a', 'assistant_incharge', 'Mathematics', TRUE),
('ta-03', 'sch-001', 't-03', 'cls-05', 'sec-05a', 'primary_incharge', 'Science', TRUE),
('ta-04', 'sch-001', 't-04', 'cls-05', 'sec-05a', 'assistant_incharge', 'Social Studies', TRUE),
('ta-05', 'sch-001', 't-05', 'cls-06', 'sec-06a', 'primary_incharge', 'Computer', TRUE)
ON DUPLICATE KEY UPDATE active=VALUES(active);

-- 11. Parents
INSERT INTO parents (id, school_id, user_id, guardian_name, phone, alternate_phone, sms_enabled) VALUES
('p-01', 'sch-001', 'u-parent-01', 'Sarah Thompson', '+91 98765 22221', '+91 98765 22299', TRUE),
('p-02', 'sch-001', 'u-parent-02', 'Nisha Sharma', '+91 98765 22222', '+91 98765 22298', TRUE),
('p-03', 'sch-001', 'u-parent-03', 'Ravi Patel', '+91 98765 22223', '+91 98765 22297', TRUE),
('p-04', 'sch-001', NULL, 'Meena Gupta', '+91 98765 22224', NULL, TRUE),
('p-05', 'sch-001', NULL, 'Arun Kumar', '+91 98765 22225', NULL, TRUE),
('p-06', 'sch-001', NULL, 'Kavya Iyer', '+91 98765 22226', NULL, TRUE),
('p-07', 'sch-001', NULL, 'Sanjay Rao', '+91 98765 22227', NULL, TRUE),
('p-08', 'sch-001', NULL, 'Lakshmi Nair', '+91 98765 22228', NULL, TRUE),
('p-09', 'sch-001', NULL, 'Vikram Singh', '+91 98765 22229', NULL, TRUE),
('p-10', 'sch-001', NULL, 'Divya Menon', '+91 98765 22230', NULL, TRUE)
ON DUPLICATE KEY UPDATE guardian_name=VALUES(guardian_name), phone=VALUES(phone);

-- 12. Students (Sample Class 4A students)
INSERT INTO students (id, school_id, class_id, section_id, parent_id, student_code, full_name, roll_no, emergency_notes) VALUES
('st-01', 'sch-001', 'cls-04', 'sec-04a', 'p-01', 'SAFE-4A-01', 'Leo Thompson', '1', 'Mild allergy to peanuts'),
('st-02', 'sch-001', 'cls-04', 'sec-04a', 'p-01', 'SAFE-4A-02', 'Maya Thompson', '2', 'No critical notes'),
('st-03', 'sch-001', 'cls-04', 'sec-04a', 'p-02', 'SAFE-4A-03', 'Aarav Sharma', '3', 'Requires front bench seating'),
('st-04', 'sch-001', 'cls-04', 'sec-04a', 'p-03', 'SAFE-4A-04', 'Ananya Patel', '4', 'No critical notes'),
('st-05', 'sch-001', 'cls-04', 'sec-04a', 'p-04', 'SAFE-4A-05', 'Vihaan Gupta', '5', 'Asthma inhaler in bag'),
('st-06', 'sch-001', 'cls-04', 'sec-04a', 'p-05', 'SAFE-4A-06', 'Diya Kumar', '6', 'No critical notes'),
('st-07', 'sch-001', 'cls-04', 'sec-04a', 'p-06', 'SAFE-4A-07', 'Arjun Iyer', '7', 'No critical notes'),
('st-08', 'sch-001', 'cls-04', 'sec-04a', 'p-07', 'SAFE-4A-08', 'Isha Rao', '8', 'No critical notes'),
('st-09', 'sch-001', 'cls-04', 'sec-04a', 'p-08', 'SAFE-4A-09', 'Kabir Nair', '9', 'No critical notes'),
('st-10', 'sch-001', 'cls-04', 'sec-04a', 'p-09', 'SAFE-4A-10', 'Riya Singh', '10', 'No critical notes'),
('st-11', 'sch-001', 'cls-04', 'sec-04a', 'p-10', 'SAFE-4A-11', 'Aditya Menon', '11', 'No critical notes'),
('st-12', 'sch-001', 'cls-04', 'sec-04a', 'p-02', 'SAFE-4A-12', 'Meera Sharma', '12', 'No critical notes'),
('st-13', 'sch-001', 'cls-04', 'sec-04a', 'p-03', 'SAFE-4A-13', 'Rohan Patel', '13', 'No critical notes'),
('st-14', 'sch-001', 'cls-04', 'sec-04a', 'p-04', 'SAFE-4A-14', 'Kavya Gupta', '14', 'No critical notes'),
('st-15', 'sch-001', 'cls-04', 'sec-04a', 'p-05', 'SAFE-4A-15', 'Ishaan Kumar', '15', 'No critical notes'),
('st-16', 'sch-001', 'cls-04', 'sec-04a', 'p-06', 'SAFE-4A-16', 'Nila Iyer', '16', 'No critical notes'),
('st-17', 'sch-001', 'cls-04', 'sec-04a', 'p-07', 'SAFE-4A-17', 'Arnav Rao', '17', 'No critical notes'),
('st-18', 'sch-001', 'cls-04', 'sec-04a', 'p-08', 'SAFE-4A-18', 'Saanvi Nair', '18', 'No critical notes'),
('st-19', 'sch-001', 'cls-04', 'sec-04a', 'p-09', 'SAFE-4A-19', 'Vivaan Singh', '19', 'No critical notes'),
('st-20', 'sch-001', 'cls-04', 'sec-04a', 'p-10', 'SAFE-4A-20', 'Tara Menon', '20', 'Late arrival expected')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), emergency_notes=VALUES(emergency_notes);

-- 13. Student Travel Status
INSERT INTO student_travel_status (student_id, school_id, status, attendance_status, last_event, last_event_at) VALUES
('st-01', 'sch-001', 'to_school', 'pending', 'ready_to_school', NOW()),
('st-02', 'sch-001', 'reached_school', 'present', 'attendance_present', NOW()),
('st-03', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-04', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-05', 'sch-001', 'going_home', 'present', 'go_out', NOW()),
('st-06', 'sch-001', 'reached_home', 'present', 'reached_home', NOW()),
('st-07', 'sch-001', 'absent', 'absent', 'attendance_absent', NOW()),
('st-08', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-09', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-10', 'sch-001', 'at_home', 'pending', 'seeded', NOW()),
('st-11', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-12', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-13', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-14', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-15', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-16', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-17', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-18', 'sch-001', 'present', 'present', 'attendance_present', NOW()),
('st-19', 'sch-001', 'reached_school', 'late', 'attendance_late', NOW()),
('st-20', 'sch-001', 'absent', 'absent', 'attendance_absent', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status), attendance_status=VALUES(attendance_status);

-- 14. Attendance Records (Morning & Go-Out)
INSERT INTO attendance_records (id, school_id, student_id, class_id, section_id, attendance_date, session, status, reason, marked_by, locked) VALUES
('att-01', 'sch-001', 'st-01', 'cls-04', 'sec-04a', CURDATE(), 'morning', 'present', NULL, 'u-teach-01', TRUE),
('att-02', 'sch-001', 'st-02', 'cls-04', 'sec-04a', CURDATE(), 'morning', 'present', NULL, 'u-teach-01', TRUE),
('att-03', 'sch-001', 'st-03', 'cls-04', 'sec-04a', CURDATE(), 'morning', 'present', NULL, 'u-teach-01', TRUE),
('att-07', 'sch-001', 'st-07', 'cls-04', 'sec-04a', CURDATE(), 'morning', 'absent', 'Doctor appointment', 'u-teach-01', TRUE),
('att-19', 'sch-001', 'st-19', 'cls-04', 'sec-04a', CURDATE(), 'morning', 'late', 'School bus delay on route 4', 'u-teach-01', FALSE),
('att-20', 'sch-001', 'st-20', 'cls-04', 'sec-04a', CURDATE(), 'morning', 'absent', 'Mild fever and rest', 'u-teach-01', TRUE)
ON DUPLICATE KEY UPDATE status=VALUES(status), reason=VALUES(reason);

-- 15. Timetable Breaks
INSERT INTO timetable_breaks (id, school_id, class_id, section_id, break_key, label, after_period, tone) VALUES
('tb-01', 'sch-001', 'cls-04', 'sec-04a', 'interval1', 'Interval-1', 2, 'interval'),
('tb-02', 'sch-001', 'cls-04', 'sec-04a', 'lunch', 'Lunch', 4, 'lunch'),
('tb-03', 'sch-001', 'cls-04', 'sec-04a', 'interval2', 'Interval-2', 6, 'interval')
ON DUPLICATE KEY UPDATE label=VALUES(label), after_period=VALUES(after_period);

-- 16. Timetable Periods (Class 4A Schedule)
INSERT INTO timetable_periods (id, school_id, class_id, section_id, day_name, period_no, subject) VALUES
('tp-01', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 1, 'English'),
('tp-02', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 2, 'Mathematics'),
('tp-03', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 3, 'Science'),
('tp-04', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 4, 'Social Studies'),
('tp-05', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 5, 'Computer'),
('tp-06', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 6, 'Library'),
('tp-07', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 7, 'Activity'),
('tp-08', 'sch-001', 'cls-04', 'sec-04a', 'Monday', 8, 'Sports'),
('tp-09', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 1, 'Mathematics'),
('tp-10', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 2, 'Science'),
('tp-11', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 3, 'English'),
('tp-12', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 4, 'Computer'),
('tp-13', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 5, 'Social Studies'),
('tp-14', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 6, 'Art'),
('tp-15', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 7, 'Sports'),
('tp-16', 'sch-001', 'cls-04', 'sec-04a', 'Tuesday', 8, 'Activity')
ON DUPLICATE KEY UPDATE subject=VALUES(subject);

-- 17. Messages & Absence Requests
INSERT INTO messages (id, school_id, conversation_type, message_kind, sender_id, recipient_id, class_id, section_id, student_id, body, created_at) VALUES
('msg-01', 'sch-001', 'parent_teacher', 'absence_request', 'u-teach-01', 'u-parent-01', 'cls-04', 'sec-04a', 'st-07', 'Kabir Nair was marked absent today. Please reply with the absence reason.', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('msg-02', 'sch-001', 'parent_teacher', 'absence_reason', 'u-parent-01', 'u-teach-01', 'cls-04', 'sec-04a', 'st-07', 'Kabir has a scheduled dentist visit this morning. He will return to class tomorrow.', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('msg-03', 'sch-001', 'parent_teacher', 'chat', 'u-parent-01', 'u-teach-01', 'cls-04', 'sec-04a', 'st-01', 'Good morning Ms. Sarah, Leo will be taking the evening school bus today.', DATE_SUB(NOW(), INTERVAL 3 HOUR))
ON DUPLICATE KEY UPDATE body=VALUES(body);

-- 18. Safety Protocols
INSERT INTO safety_protocols (id, school_id, role_key, label, checked, submitted, active) VALUES
('sp-01', 'sch-001', 'parent', 'Verify pickup person before handover', TRUE, TRUE, TRUE),
('sp-02', 'sch-001', 'parent', 'Keep emergency contact number updated', TRUE, TRUE, TRUE),
('sp-03', 'sch-001', 'parent', 'Confirm absence reason before 9:30 AM', TRUE, TRUE, TRUE),
('sp-04', 'sch-001', 'teacher', 'Morning roll-call synchronized', TRUE, TRUE, TRUE),
('sp-05', 'sch-001', 'teacher', 'Dismissal badges prepared', TRUE, TRUE, TRUE),
('sp-06', 'sch-001', 'teacher', 'Emergency contact logs synced', TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE checked=VALUES(checked), submitted=VALUES(submitted);

-- 19. Result Exams
INSERT INTO result_exams (id, school_id, class_id, section_id, name, active, created_by, updated_by) VALUES
('re-01', 'sch-001', 'cls-04', 'sec-04a', 'Quarterly Assessment', TRUE, 'u-admin-01', 'u-admin-01'),
('re-02', 'sch-001', 'cls-04', 'sec-04a', 'Mid-Term Examination', TRUE, 'u-admin-01', 'u-admin-01')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 20. Result Components
INSERT INTO result_components (id, exam_id, subject, label, maximum_marks, sort_order) VALUES
('rc-01', 're-01', 'English', 'Internal 1', 25.00, 1),
('rc-02', 're-01', 'English', 'Internal 2', 25.00, 2),
('rc-03', 're-01', 'English', 'Exam', 50.00, 3),
('rc-04', 're-01', 'Mathematics', 'Internal 1', 25.00, 1),
('rc-05', 're-01', 'Mathematics', 'Internal 2', 25.00, 2),
('rc-06', 're-01', 'Mathematics', 'Exam', 50.00, 3),
('rc-07', 're-01', 'Science', 'Internal 1', 25.00, 1),
('rc-08', 're-01', 'Science', 'Internal 2', 25.00, 2),
('rc-09', 're-01', 'Science', 'Exam', 50.00, 3)
ON DUPLICATE KEY UPDATE maximum_marks=VALUES(maximum_marks);

-- 21. Student Result Marks
INSERT INTO student_result_marks (id, student_id, result_component_id, marks_obtained, entered_by) VALUES
('srm-01', 'st-01', 'rc-01', 24.00, 'u-teach-01'),
('srm-02', 'st-01', 'rc-02', 23.50, 'u-teach-01'),
('srm-03', 'st-01', 'rc-03', 48.00, 'u-teach-01'),
('srm-04', 'st-02', 'rc-01', 25.00, 'u-teach-01'),
('srm-05', 'st-02', 'rc-02', 24.00, 'u-teach-01'),
('srm-06', 'st-02', 'rc-03', 49.50, 'u-teach-01'),
('srm-07', 'st-03', 'rc-01', 22.00, 'u-teach-01'),
('srm-08', 'st-03', 'rc-02', 23.00, 'u-teach-01'),
('srm-09', 'st-03', 'rc-03', 45.00, 'u-teach-01')
ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained);

-- 22. Incident Logs
INSERT INTO incident_logs (id, school_id, student_id, incident_code, incident_type, level, priority, status, handler_name, detail) VALUES
('inc-01', 'sch-001', 'st-01', 'INC-SAFE-001', 'Medical Check', 'Low', 'Normal', 'accepted', 'School Nurse', 'Routine allergy check completed successfully.'),
('inc-02', 'sch-001', 'st-19', 'INC-SAFE-002', 'Transport Delay', 'Medium', 'Elevated', 'resolved', 'Transport Officer', 'Bus route 4 encountered traffic congestion on Outer Ring Road.')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 23. Safety Reports
INSERT INTO safety_reports (id, school_id, class_id, section_id, report_title, safety_score, alert_count, attendance_percent, report_text) VALUES
('sr-01', 'sch-001', 'cls-04', 'sec-04a', 'Class 4A Monthly Safety Report', 98, 0, 96.50, 'Excellent overall compliance with child handover and morning sync protocols.'),
('sr-02', 'sch-001', 'cls-05', 'sec-05a', 'Class 5A Monthly Safety Report', 95, 1, 94.00, 'One minor transport delay resolved within 15 minutes.')
ON DUPLICATE KEY UPDATE safety_score=VALUES(safety_score);

-- 24. Industry Menu Access
INSERT INTO industry_menu_access (school_id, menu_key, enabled, updated_by) VALUES
('sch-001', 'table', TRUE, 'u-main-01'),
('sch-001', 'messages', TRUE, 'u-main-01'),
('sch-001', 'attendance', TRUE, 'u-main-01'),
('sch-001', 'timetable', TRUE, 'u-main-01'),
('sch-001', 'reports', TRUE, 'u-main-01')
ON DUPLICATE KEY UPDATE enabled=VALUES(enabled);

-- 25. Notifications
INSERT INTO notifications (id, school_id, audience_role, user_id, title, body, event_type, read_at) VALUES
('notif-01', 'sch-001', 'parent', 'u-parent-01', 'Safe Arrival Notice', 'Leo Thompson has safely reached classroom Room 4A.', 'travel.reached_school', NOW()),
('notif-02', 'sch-001', 'teacher', 'u-teach-01', 'Attendance Synced', 'Morning attendance for Class 4A submitted and locked.', 'attendance.locked', NOW())
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 26. SMS Delivery Logs
INSERT INTO sms_delivery_logs (id, school_id, student_id, to_phone, body, provider, provider_message_id, status) VALUES
('sms-01', 'sch-001', 'st-01', '+91 98765 22221', 'SafeReach: Leo Thompson status updated to Tracking to School.', 'twilio', 'SM992837482910', 'delivered'),
('sms-02', 'sch-001', 'st-07', '+91 98765 22228', 'SafeReach: Kabir Nair is absent today. Please reply with the reason in the app.', 'twilio', 'SM992837482911', 'delivered')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 27. Audit Logs
INSERT INTO audit_logs (id, action, entity_type, entity_id, payload, actor_user_id, school_id) VALUES
('aud-01', 'auth.login_success', 'user', 'u-admin-01', '{"ip": "127.0.0.1", "device": "Desktop Chrome"}', 'u-admin-01', 'sch-001'),
('aud-02', 'attendance.morning_submitted', 'classroom', 'sec-04a', '{"present": 18, "absent": 2, "late": 1}', 'u-teach-01', 'sch-001')
ON DUPLICATE KEY UPDATE action=VALUES(action);

-- 28. API Test Results
INSERT INTO api_test_results (id, test_name, service_name, status, detail) VALUES
('tst-01', 'database_connection_test', 'MySQL 8.0 Primary', 'passed', 'Connection established and all 28 tables verified with sample records.'),
('tst-02', 'jwt_authentication_test', 'PHP Security Module', 'passed', 'HS256 access and refresh tokens generating correctly.'),
('tst-03', 'sms_delivery_gateway', 'Twilio Gateway Service', 'passed', 'Mock SMS test mode operational.')
ON DUPLICATE KEY UPDATE status=VALUES(status);

SET FOREIGN_KEY_CHECKS = 1;
