import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navigation from "./Navigation";

function Payroll() {
    const { user, updateUser } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [leaveDays, setLeaveDays] = useState({});
    const [lateDays, setLateDays] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDept, setFilterDept] = useState("all");
    const [updating, setUpdating] = useState(null);

    const isAdmin = user && (user.role === "admin" || user.role === "manager");
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const workingDays = 26;

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const empData = await api.getEmployees();
            setEmployees(empData);
            try {
                const monthAtt = await api.getAttendanceByMonth(currentYear, currentMonth);
                const leaveMap = {};
                const lateMap = {};
                monthAtt.forEach(rec => {
                    if (rec.status === "leave") {
                        leaveMap[rec.employee_id] = (leaveMap[rec.employee_id] || 0) + 1;
                    }
                    if (rec.status === "late") {
                        lateMap[rec.employee_id] = (lateMap[rec.employee_id] || 0) + 1;
                    }
                });
                setLeaveDays(leaveMap);
                setLateDays(lateMap);
            } catch (e) { console.error(e); }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function calcSalary(basic, empId) {
        const b = parseFloat(basic) || 0;
        const hra = Math.round(b * 0.20);
        const ta = Math.round(b * 0.05);
        const medical = Math.round(b * 0.05);
        const gross = b + hra + ta + medical;
        const pf = Math.round(b * 0.12);
        const tax = Math.round(gross * 0.05);
        const leaves = leaveDays[empId] || 0;
        const late = lateDays[empId] || 0;
        const leaveDeduct = Math.round((gross / workingDays) * leaves);
        const lateDeduct = Math.round((gross / workingDays / 2) * late);
        const net = Math.max(gross - pf - tax - leaveDeduct - lateDeduct, 0);
        return { basic: b, hra, ta, medical, gross, pf, tax, leaves, leaveDeduct, late, lateDeduct, net };
    }

    function fmt(n) { return "\u20B9" + Number(n).toLocaleString("en-IN"); }

    function badgeStyle(status) {
        if (status === "paid") return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" };
        if (status === "processing") return { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" };
        return { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" };
    }

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const filtered = employees.filter(emp => {
        const ms = (emp.name || "").toLowerCase().includes(search.toLowerCase()) || (emp.id || "").toLowerCase().includes(search.toLowerCase());
        const mst = filterStatus === "all" || emp.payroll_status === filterStatus;
        const md = filterDept === "all" || emp.department === filterDept;
        return ms && mst && md;
    });

    const totals = employees.reduce((acc, e) => {
        const s = calcSalary(e.salary, e.id);
        acc.net += s.net;
        acc.basic += s.basic;
        acc.allowances += s.hra + s.ta + s.medical;
        acc.deductions += s.pf + s.tax + s.leaveDeduct + s.lateDeduct;
        return acc;
    }, { net: 0, basic: 0, allowances: 0, deductions: 0 });

    const paidCount = employees.filter(e => e.payroll_status === "paid").length;
    const pendingCount = employees.filter(e => e.payroll_status === "pending").length;
    const processingCount = employees.filter(e => e.payroll_status === "processing").length;

    async function handleStatusChange(empId, newStatus) {
        if (!isAdmin) return;
        setUpdating(empId);
        try {
            const res = await api.updatePayrollStatus(empId, newStatus);
            if (res.success) {
                setEmployees(prev => prev.map(e => e.id === empId ? { ...e, payroll_status: newStatus } : e));
                // If the changed employee is the logged-in user, sync AuthContext too
                if (user && user.id === empId) {
                    updateUser({ payroll_status: newStatus });
                }
            }
        } catch (err) { console.error(err); }
        finally { setUpdating(null); }
    }

    async function handleMarkAllPaid() {
        if (!isAdmin) return;
        for (const emp of filtered.filter(e => e.payroll_status !== "paid")) await handleStatusChange(emp.id, "paid");
    }

    const cards = [
        { label: "Total Net Payroll", value: fmt(totals.net), color: "#6366f1" },
        { label: "Total Basic", value: fmt(totals.basic), color: "#0ea5e9" },
        { label: "Total Allowances", value: fmt(totals.allowances), color: "#10b981" },
        { label: "Total Deductions", value: fmt(totals.deductions), color: "#ef4444" },
        { label: "Paid", value: paidCount, color: "#10b981" },
        { label: "Pending", value: pendingCount, color: "#f59e0b" },
        { label: "Processing", value: processingCount, color: "#3b82f6" },
        { label: "Total Employees", value: employees.length, color: "#8b5cf6" },
    ];

    const headers = ["Employee", "Dept", "Basic", "HRA 20%", "TA 5%", "Medical 5%", "Gross", "PF 12%", "Tax 5%", "Leave Days", "Leave Deduct", "Late Days", "Late Deduct (½)", "Net Pay", "Status", "Action"];

    if (loading) return React.createElement("div", { style: { fontFamily: "Segoe UI,sans-serif", minHeight: "100vh", background: "#f8fafc" } },
        React.createElement(Navigation, null),
        React.createElement("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" } },
            React.createElement("p", { style: { color: "#6b7280", fontSize: "18px" } }, "Loading payroll data...")
        )
    );

    return React.createElement("div", { style: { fontFamily: "Segoe UI,sans-serif", background: "#f8fafc", minHeight: "100vh" } },
        React.createElement(Navigation, null),
        React.createElement("div", { style: { padding: "24px", paddingTop: "6rem" } },

            // Header
            React.createElement("div", { style: { marginBottom: "24px" } },
                React.createElement("h2", { style: { margin: 0, fontSize: "26px", fontWeight: 700, color: "#1e293b" } }, "Payroll Management"),
                React.createElement("p", { style: { margin: "4px 0 0", color: "#64748b" } },
                    now.toLocaleString("en-IN", { month: "long", year: "numeric" }) +
                    " \u2014 Leave: full day | Late: half day deduction (Gross \u00F7 " + workingDays + ")"
                )
            ),

            // Summary cards
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "16px", marginBottom: "24px" } },
                cards.map((card, i) =>
                    React.createElement("div", { key: i, style: { background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: "4px solid " + card.color } },
                        React.createElement("div", { style: { fontSize: "20px", fontWeight: 700, color: card.color } }, card.value),
                        React.createElement("div", { style: { fontSize: "12px", color: "#64748b", marginTop: "4px" } }, card.label)
                    )
                )
            ),

            // Filters
            React.createElement("div", { style: { background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" } },
                React.createElement("input", { type: "text", placeholder: "Search by name or ID...", value: search, onChange: e => setSearch(e.target.value), style: { flex: 1, minWidth: "200px", padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" } }),
                React.createElement("select", { value: filterStatus, onChange: e => setFilterStatus(e.target.value), style: { padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#fff" } },
                    React.createElement("option", { value: "all" }, "All Status"),
                    React.createElement("option", { value: "paid" }, "Paid"),
                    React.createElement("option", { value: "pending" }, "Pending"),
                    React.createElement("option", { value: "processing" }, "Processing")
                ),
                React.createElement("select", { value: filterDept, onChange: e => setFilterDept(e.target.value), style: { padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#fff" } },
                    React.createElement("option", { value: "all" }, "All Departments"),
                    departments.map(d => React.createElement("option", { key: d, value: d }, d))
                ),
                isAdmin && React.createElement("button", { onClick: handleMarkAllPaid, style: { padding: "9px 18px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } }, "Mark All Paid"),
                React.createElement("button", { onClick: loadData, style: { padding: "9px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" } }, "Refresh")
            ),

            // Table
            React.createElement("div", { style: { background: "#fff", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" } },
                React.createElement("div", { style: { overflowX: "auto" } },
                    React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "14px" } },
                        React.createElement("thead", null,
                            React.createElement("tr", { style: { background: "#f1f5f9" } },
                                headers.map(h =>
                                    React.createElement("th", { key: h, style: { padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" } }, h)
                                )
                            )
                        ),
                        React.createElement("tbody", null,
                            filtered.length === 0
                                ? React.createElement("tr", null,
                                    React.createElement("td", { colSpan: 16, style: { textAlign: "center", padding: "40px", color: "#94a3b8" } }, "No employees found")
                                )
                                : filtered.map((emp, idx) => {
                                    const s = calcSalary(emp.salary, emp.id);
                                    const bs = badgeStyle(emp.payroll_status);
                                    return React.createElement("tr", { key: emp.id, style: { borderTop: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafa" } },
                                        // Employee
                                        React.createElement("td", { style: { padding: "12px 14px" } },
                                            React.createElement("div", { style: { fontWeight: 600, color: "#1e293b" } }, emp.name),
                                            React.createElement("div", { style: { fontSize: "12px", color: "#94a3b8" } }, emp.id)
                                        ),
                                        // Dept
                                        React.createElement("td", { style: { padding: "12px 14px", color: "#475569" } }, emp.department || "-"),
                                        // Basic
                                        React.createElement("td", { style: { padding: "12px 14px", color: "#10b981" } }, fmt(s.basic)),
                                        // HRA
                                        React.createElement("td", { style: { padding: "12px 14px", color: "#10b981" } }, fmt(s.hra)),
                                        // TA
                                        React.createElement("td", { style: { padding: "12px 14px", color: "#10b981" } }, fmt(s.ta)),
                                        // Medical
                                        React.createElement("td", { style: { padding: "12px 14px", color: "#10b981" } }, fmt(s.medical)),
                                        // Gross
                                        React.createElement("td", { style: { padding: "12px 14px", fontWeight: 600, color: "#0ea5e9" } }, fmt(s.gross)),
                                        // PF
                                        React.createElement("td", { style: { padding: "12px 14px", color: "#ef4444" } }, fmt(s.pf)),
                                        // Tax
                                        React.createElement("td", { style: { padding: "12px 14px", color: "#ef4444" } }, fmt(s.tax)),
                                        // Leave Days
                                        React.createElement("td", { style: { padding: "12px 14px", textAlign: "center" } },
                                            React.createElement("span", { style: { background: s.leaves > 0 ? "#fef3c7" : "#f0fdf4", color: s.leaves > 0 ? "#92400e" : "#166534", padding: "2px 10px", borderRadius: "10px", fontWeight: 600, fontSize: "13px" } }, s.leaves + "d")
                                        ),
                                        // Leave Deduct
                                        React.createElement("td", { style: { padding: "12px 14px", color: s.leaveDeduct > 0 ? "#ef4444" : "#94a3b8", fontWeight: s.leaveDeduct > 0 ? 600 : 400 } },
                                            s.leaveDeduct > 0 ? "-" + fmt(s.leaveDeduct) : "-"
                                        ),
                                        // Late Days
                                        React.createElement("td", { style: { padding: "12px 14px", textAlign: "center" } },
                                            React.createElement("span", { style: { background: s.late > 0 ? "#fee2e2" : "#f0fdf4", color: s.late > 0 ? "#991b1b" : "#166534", padding: "2px 10px", borderRadius: "10px", fontWeight: 600, fontSize: "13px" } }, s.late + "d")
                                        ),
                                        // Late Deduct (half day)
                                        React.createElement("td", { style: { padding: "12px 14px", color: s.lateDeduct > 0 ? "#ef4444" : "#94a3b8", fontWeight: s.lateDeduct > 0 ? 600 : 400 } },
                                            s.lateDeduct > 0 ? "-" + fmt(s.lateDeduct) : "-"
                                        ),
                                        // Net Pay
                                        React.createElement("td", { style: { padding: "12px 14px", fontWeight: 700, color: "#6366f1" } }, fmt(s.net)),
                                        // Status badge
                                        React.createElement("td", { style: { padding: "12px 14px" } },
                                            React.createElement("span", { style: { ...bs, padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 } },
                                                emp.payroll_status ? emp.payroll_status.charAt(0).toUpperCase() + emp.payroll_status.slice(1) : "Pending"
                                            )
                                        ),
                                        // Action
                                        React.createElement("td", { style: { padding: "12px 14px" } },
                                            isAdmin && React.createElement("select", {
                                                value: emp.payroll_status || "pending",
                                                onChange: e => handleStatusChange(emp.id, e.target.value),
                                                disabled: updating === emp.id,
                                                style: { padding: "5px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", background: "#fff", cursor: "pointer" }
                                            },
                                                React.createElement("option", { value: "pending" }, "Pending"),
                                                React.createElement("option", { value: "processing" }, "Processing"),
                                                React.createElement("option", { value: "paid" }, "Paid")
                                            )
                                        )
                                    );
                                })
                        )
                    )
                )
            )
        )
    );
}

export default Payroll;
