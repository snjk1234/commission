// @ts-nocheck
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  Calculator, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Trash2,
  Edit2,
  Plus,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Archive,
  History,
  Printer,
  Lock,
  Unlock,
  LayoutDashboard,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Award,
  Bell
} from 'lucide-react';
import { SUPERVISORS_DATA, calculateCommissionRate, SupervisorGroup } from '@/lib/commission-utils';
import { createClient } from '@/utils/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const supabase = createClient();

// Helper to force English (Western Arabic) digits and formatting
const formatNumber = (num: number, digits: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
    useGrouping: true
  }).format(num);
};

// Arabic Normalization Helper
const normalizeArabic = (text: string) => {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, '') // Remove all spaces for matching
    .trim();
};

const SUPERVISOR_COLORS = [
  { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', accent: 'bg-blue-600', hover: 'hover:border-blue-500/50' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', accent: 'bg-emerald-600', hover: 'hover:border-emerald-500/50' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', accent: 'bg-amber-600', hover: 'hover:border-amber-500/50' },
  { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', accent: 'bg-purple-600', hover: 'hover:border-purple-500/50' },
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', accent: 'bg-rose-600', hover: 'hover:border-rose-500/50' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', accent: 'bg-indigo-600', hover: 'hover:border-indigo-500/50' },
  { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20', accent: 'bg-teal-600', hover: 'hover:border-teal-500/50' },
  { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', accent: 'bg-orange-600', hover: 'hover:border-orange-500/50' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', accent: 'bg-cyan-600', hover: 'hover:border-cyan-500/50' },
  { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20', accent: 'bg-pink-600', hover: 'hover:border-pink-500/50' },
];

interface ExcelRow {
  [key: string]: any;
}

interface CalculatedData {
  id: number;
  branchName: string;
  sales2024: number;
  sales2025: number;
  difference: number;
  growth: number;
  rate: number;
  commission: number;
  isNew: boolean;
  splitSalesP1?: number; // Manual entry for first 17 days
  isSplit?: boolean;
  openingDay?: number;
}

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAmountsHidden, setIsAmountsHidden] = useState(true);
  const [data2024, setData2024] = useState<ExcelRow[]>([]);
  const [data2025, setData2025] = useState<ExcelRow[]>([]);
  const [calculatedData, setCalculatedData] = useState<CalculatedData[]>([]);
  const [activeFilterType, setActiveFilterType] = useState<'all' | 'new' | 'partial' | 'no-supervisor' | 'no-sales' | 'zero-sales' | 'supervisor' | 'branch'>('all');

  const navigateTo = (tab: string, filterStr: string = '', filterType: typeof activeFilterType = 'all') => {
    setActiveTab(tab);
    setSearchTerm(filterStr);
    setActiveFilterType(filterType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Database State
  const [dbBranches, setDbBranches] = useState<{id: string, name: string}[]>([]);
  const [dbSupervisors, setDbSupervisors] = useState<{id: string, name: string}[]>([]);
  const [dbAssignments, setDbAssignments] = useState<{branch_id: string, supervisor_id: string, share: number}[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [fileName, setFileName] = useState('');

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<{id: string, name: string, opening_day?: number, opening_month?: number} | null>(null);
  const [modalBranchName, setModalBranchName] = useState('');
  const [modalBranchOpeningDay, setModalBranchOpeningDay] = useState<number | ''>('');
  const [modalBranchOpeningMonth, setModalBranchOpeningMonth] = useState<number | ''>('');
  const [modalBranchSupervisors, setModalBranchSupervisors] = useState<{id: string, share: number}[]>([]);

  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<{id: string, name: string} | null>(null);
  const [modalSupervisorName, setModalSupervisorName] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [archives, setArchives] = useState<any[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<any>(null);
  const [archiveDetails, setArchiveDetails] = useState<any[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  // Results Editing State
  const [editingResult, setEditingResult] = useState<any>(null);
  const [isResultEditModalOpen, setIsResultEditModalOpen] = useState(false);
  const [editSales2024, setEditSales2024] = useState(0);
  const [editSales2025, setEditSales2025] = useState(0);
  const [editSplitSalesP1, setEditSplitSalesP1] = useState(0);

  // Dynamic Years & Month State
  const [yearPrev, setYearPrev] = useState(2024);
  const [yearCurr, setYearCurr] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const supervisorColorMap = useMemo(() => {
    const map: Record<string, typeof SUPERVISOR_COLORS[0]> = {};
    dbSupervisors.forEach((sup, index) => {
      map[sup.id] = SUPERVISOR_COLORS[index % SUPERVISOR_COLORS.length];
    });
    return map;
  }, [dbSupervisors]);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Fetch archives when switching to archive tab
  useEffect(() => {
    if (activeTab === 'archive') {
      fetchArchives();
    }
  }, [activeTab]);

  const fetchArchives = async () => {
    setIsArchiveLoading(true);
    try {
      const { data } = await supabase
        .from('commission_archives')
        .select('*')
        .order('created_at', { ascending: false });
      setArchives(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const viewArchiveDetails = async (archiveId: string) => {
    setIsArchiveLoading(true);
    try {
      const { data: archive } = await supabase
        .from('commission_archives')
        .select('*')
        .eq('id', archiveId)
        .single();
      
      const { data: items } = await supabase
        .from('commission_archive_items')
        .select('*')
        .eq('archive_id', archiveId);
      
      setSelectedArchive(archive);
      setArchiveDetails(items || []);
      
      if (items && items.length > 0) {
        const reconstructed2024 = items.map(item => {
          const cleanName = item.branch_name.replace(' (جديد)', '').replace(' (افتتاح جزئي)', '');
          return {
            branchName: cleanName,
            normalizedName: normalizeArabic(cleanName),
            sales: item.sales_2024
          };
        });
        const reconstructed2025 = items.map(item => {
          const cleanName = item.branch_name.replace(' (جديد)', '').replace(' (افتتاح جزئي)', '');
          return {
            branchName: cleanName,
            normalizedName: normalizeArabic(cleanName),
            sales: item.sales_2025
          };
        });
        
        setData2024(reconstructed2024);
        setData2025(reconstructed2025);
      }
      
      setSearchTerm(''); // Clear search when viewing archive details
    } catch (err) {
      console.error(err);
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const handleDeleteArchive = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا الأرشيف نهائياً؟')) return;
    try {
      const { error } = await supabase.from('commission_archives').delete().eq('id', id);
      if (error) throw error;
      setArchives(archives.filter(a => a.id !== id));
      if (selectedArchive?.id === id) setSelectedArchive(null);
      alert('تم حذف الأرشيف بنجاح');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleUpdateSales = async () => {
    if (!editingResult) return;
    try {
      setIsLoading(true);
      
      // Update local state for immediate feedback
      setCalculatedData(prev => prev.map(item => {
        if (item.branchName === editingResult.branchName) {
          const newSales25 = editSales2025;
          const newSales24 = editSales2024;
          const isSplit = item.isSplit;
          
          let commission = 0;
          let rate = 0;
          let difference = 0;
          let growth = 0;

          if (isSplit) {
            const salesP1 = editSplitSalesP1;
            const salesP2 = newSales25 - salesP1;
            const rateP1 = calculateCommissionRate(0, true, item.branchName);
            const commissionP1 = salesP1 * rateP1;
            
            const growthP2 = newSales24 !== 0 ? ((salesP2 / newSales24) - 1) * 100 : 0;
            const rateP2 = salesP2 - newSales24 < 0 ? 0 : calculateCommissionRate(growthP2, false, item.branchName);
            const commissionP2 = salesP2 * rateP2;
            
            commission = commissionP1 + commissionP2;
            rate = newSales25 !== 0 ? commission / newSales25 : 0;
            difference = newSales25 - newSales24;
            growth = growthP2; // Using growth of the compared period
          } else if (item.isNew) {
            difference = newSales25;
            growth = 100;
            rate = calculateCommissionRate(0, true, item.branchName);
            commission = newSales25 * rate;
          } else {
            difference = newSales25 - newSales24;
            growth = newSales24 !== 0 ? ((newSales25 / newSales24) - 1) * 100 : 0;
            rate = difference < 0 ? 0 : calculateCommissionRate(growth, false, item.branchName);
            commission = newSales25 * rate;
          }

          return {
            ...item,
            sales2024: newSales24,
            sales2025: newSales25,
            splitSalesP1: editSplitSalesP1,
            difference,
            growth: parseFloat(growth.toFixed(2)),
            rate,
            commission
          };
        }
        return item;
      }));

      // In a real app, you'd also save editSplitSalesP1 to a dedicated table or JSON field
      await supabase.from('commission_data')
        .upsert({ branch_name: editingResult.branchName, year: yearPrev, sales: editSales2024 }, { onConflict: 'branch_name,year' });
      await supabase.from('commission_data')
        .upsert({ branch_name: editingResult.branchName, year: yearCurr, sales: editSales2025 }, { onConflict: 'branch_name,year' });
      
      setIsResultEditModalOpen(false);
      setEditingResult(null);
      alert('تم تحديث البيانات بنجاح');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التحديث');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAndArchive = async () => {
    if (filteredResults.length === 0) {
      alert('لا توجد نتائج لتصديرها');
      return;
    }

    try {
      // 1. Prepare Excel Data
      const excelData = filteredResults.map((row, idx) => ({
        'م': idx + 1,
        'اسم الفرع': row.branchName,
        [`مبيعات ${yearPrev}`]: row.sales2024,
        [`مبيعات ${yearCurr}`]: row.sales2025,
        'الفارق': row.difference,
        'النمو %': row.growth,
        'نسبة العمولة %': formatNumber(row.rate * 100, 1),
        'قيمة العمولة': row.commission,
        'المشرف': row.supervisorNames,
        'عمولة المشرف (10%)': row.supervisorCommission10,
        'ملاحظات': row.isSplit ? `تم التقسيم (مبيعات الفترة الأولى: ${row.splitSalesP1})` : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "العمولات");
      
      const timestamp = new Date().toLocaleString('ar-EG', { hour12: false }).replace(/[/:]/g, '-');
      const fullFileName = `تقرير_العمولات_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, fullFileName);

      // 2. Save to Database Archive
      const totalCommission = filteredResults.reduce((sum, r) => sum + r.commission, 0);
      const totalSupCommission = filteredResults.reduce((sum, r) => sum + r.supervisorCommission10, 0);

      const { data: archive, error: archiveError } = await supabase
        .from('commission_archives')
        .insert({
          filename: fullFileName,
          total_commission: totalCommission,
          total_supervisors_commission: totalSupCommission
        })
        .select()
        .single();

      if (archiveError) throw archiveError;

      const archiveItems = filteredResults.map(row => {
        let nameSuffix = '';
        if (row.isNew) nameSuffix = ' (جديد)';
        else if (row.isSplit) nameSuffix = ' (افتتاح جزئي)';
        
        return {
          archive_id: archive.id,
          branch_name: row.branchName + nameSuffix,
          sales_2024: row.sales2024,
          sales_2025: row.sales2025,
          growth: row.growth,
          rate: row.rate,
          commission: row.commission,
          supervisor_names: row.supervisorNames,
          supervisor_commission: row.supervisorCommission10
        };
      });

      const { error: itemsError } = await supabase
        .from('commission_archive_items')
        .insert(archiveItems);

      if (itemsError) throw itemsError;

      alert('تم تصدير ملف الإكسل وحفظ النسخة في الأرشيف بنجاح');
      if (activeTab === 'archive') fetchArchives();
    } catch (error) {
      console.error('Error during export/archive:', error);
      alert('حدث خطأ أثناء حفظ الأرشيف، تأكد من وجود الجداول المطلوبة');
    }
  };

  const handlePrintSupervisors = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableContent = filteredSupervisors.map((sup, idx) => `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${sup.name}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${sup.branchesCount}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; direction: ltr;">${formatNumber(sup.share * 100, 1)}%</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; direction: ltr;">${formatNumber(sup.supervisorCommission, 2)}</td>
      </tr>
    `).join('');

    const totalCommission = filteredSupervisors.reduce((sum, s) => sum + s.supervisorCommission, 0);

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير عمولات المشرفين</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Changa:wght@300;400;700&display=swap');
            body { font-family: 'Changa', sans-serif; padding: 40px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f8fafc; padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 13px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
            .header h1 { font-size: 24px; }
            .footer { margin-top: 30px; text-align: left; font-size: 12px; color: #666; }
            .total-row { background-color: #f1f5f9; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #1e293b;">تقرير عمولات المشرفين</h1>
            <p style="margin: 10px 0 0 0; color: #64748b;">التاريخ: ${new Date().toLocaleDateString('ar-EG')} | شهر التقرير: ${selectedMonth}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 50px;">م</th>
                <th>اسم المشرف</th>
                <th style="text-align: center;">عدد الفروع</th>
                <th style="text-align: center;">الحصة</th>
                <th style="text-align: right;">إجمالي العمولة</th>
              </tr>
            </thead>
            <tbody>
              ${tableContent}
              <tr class="total-row">
                <td colspan="4" style="padding: 15px; text-align: left; border: 1px solid #ddd;">الإجمالي الكلي</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd;">${formatNumber(totalCommission, 2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>تم استخراج هذا التقرير من نظام إدارة العمولات</p>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintResults = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableContent = filteredResults.map((row, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: right; font-weight: bold;">
          ${row.branchName}
          ${row.isNew ? '<span style="font-size: 9px; color: #16a34a;"> (جديد)</span>' : ''}
          ${row.isSplit ? '<span style="font-size: 9px; color: #ea580c;"> (جزئي)</span>' : ''}
        </td>
        <td style="text-align: center; direction: ltr;">${formatNumber(row.sales2024)}</td>
        <td style="text-align: center; direction: ltr;">${formatNumber(row.sales2025)}</td>
        <td style="text-align: center; direction: ltr; color: ${row.difference >= 0 ? '#16a34a' : '#e11d48'};">${formatNumber(row.difference)}</td>
        <td style="text-align: center; direction: ltr; color: #2563eb; font-weight: bold;">${formatNumber(row.growth, 2)}%</td>
        <td style="text-align: center; direction: ltr; font-weight: bold; color: #d97706;">${formatNumber(row.rate * 100, 1)}%</td>
        <td style="text-align: center; direction: ltr; font-weight: bold;">${formatNumber(row.commission, 2)}</td>
        <td style="text-align: right;">${row.supervisorNames}</td>
        <td style="text-align: center; direction: ltr; font-weight: bold;">${formatNumber(row.supervisorCommission10, 2)}</td>
      </tr>
    `).join('');

    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = monthNames[selectedMonth - 1] || selectedMonth;
    
    let supervisorName = 'الكل';
    if (activeFilterType === 'supervisor' && searchTerm) {
      supervisorName = searchTerm;
    } else if (searchTerm && dbSupervisors.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
      supervisorName = searchTerm;
    } else if (searchTerm) {
      supervisorName = 'بحث: ' + searchTerm;
    } else if (activeFilterType === 'new') {
      supervisorName = 'الفروع الجديدة';
    } else if (activeFilterType === 'partial') {
      supervisorName = 'افتتاح جزئي';
    }

    const totalCommission = filteredResults.reduce((sum, r) => sum + r.commission, 0);
    const totalSupCommission = filteredResults.reduce((sum, r) => sum + r.supervisorCommission10, 0);

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير العمولات</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
            @page { margin: 0.5cm; }
            body { font-family: 'Tajawal', sans-serif; padding: 0; color: #333; font-size: 10px; line-height: 1.2; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            th { background-color: #f8fafc; padding: 4px; border: 1px solid #ddd; text-align: center; font-size: 11px; }
            td { padding: 2px 4px; border: 1px solid #ddd; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .header h1 { font-size: 18px; color: #1e293b; margin: 0 0 5px 0; }
            .footer { margin-top: 20px; text-align: left; font-size: 10px; color: #666; }
            .total-row td { background-color: #f1f5f9; font-weight: bold; padding: 6px 4px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير عمولات فروع (${supervisorName}) لشهر (${monthName} ${yearCurr})</h1>
            <p style="margin: 5px 0 0 0; color: #64748b;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">م</th>
                <th>اسم الفرع</th>
                <th>مبيعات ${yearPrev}</th>
                <th>مبيعات ${yearCurr}</th>
                <th>الفارق</th>
                <th>النمو %</th>
                <th>العمولة %</th>
                <th>القيمة</th>
                <th>المشرف</th>
                <th>عمولة المشرف</th>
              </tr>
            </thead>
            <tbody>
              ${tableContent}
              <tr class="total-row">
                <td colspan="7" style="text-align: left;">الإجمالي الكلي</td>
                <td style="text-align: center; direction: ltr;">${formatNumber(totalCommission, 2)}</td>
                <td></td>
                <td style="text-align: center; direction: ltr;">${formatNumber(totalSupCommission, 2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>تم استخراج هذا التقرير من نظام إدارة العمولات</p>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintArchive = () => {
    if (!selectedArchive) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableContent = archiveDetails.map((row, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: right; font-weight: bold;">
          ${row.branch_name}
        </td>
        <td style="text-align: center; direction: ltr;">${formatNumber(row.sales_2024)}</td>
        <td style="text-align: center; direction: ltr;">${formatNumber(row.sales_2025)}</td>
        <td style="text-align: center; direction: ltr; color: ${row.sales_2025 - row.sales_2024 >= 0 ? '#16a34a' : '#e11d48'};">${formatNumber(row.sales_2025 - row.sales_2024)}</td>
        <td style="text-align: center; direction: ltr; color: #2563eb; font-weight: bold;">${formatNumber(row.growth, 2)}%</td>
        <td style="text-align: center; direction: ltr; font-weight: bold; color: #d97706;">${formatNumber(row.rate * 100, 1)}%</td>
        <td style="text-align: center; direction: ltr; font-weight: bold;">${formatNumber(row.commission, 2)}</td>
        <td style="text-align: right;">${row.supervisor_names}</td>
        <td style="text-align: center; direction: ltr; font-weight: bold;">${formatNumber(row.supervisor_commission, 2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة الأرشيف - ${selectedArchive.filename}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
            @page { margin: 0.5cm; }
            body { font-family: 'Tajawal', sans-serif; padding: 0; color: #333; font-size: 10px; line-height: 1.2; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            th { background-color: #f8fafc; padding: 4px; border: 1px solid #ddd; text-align: center; font-size: 11px; }
            td { padding: 2px 4px; border: 1px solid #ddd; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .header h1 { font-size: 18px; color: #1e293b; margin: 0 0 5px 0; }
            .footer { margin-top: 20px; text-align: left; font-size: 10px; color: #666; }
            .total-row td { background-color: #f1f5f9; font-weight: bold; padding: 6px 4px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>أرشيف العمولات: ${selectedArchive.filename.replace('[رفع ملف] ', '')}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b;">تاريخ الحفظ: ${new Date(selectedArchive.created_at).toLocaleString('ar-EG')} | تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">م</th>
                <th>اسم الفرع</th>
                <th>مبيعات ${yearPrev}</th>
                <th>مبيعات ${yearCurr}</th>
                <th>الفارق</th>
                <th>النمو %</th>
                <th>العمولة %</th>
                <th>القيمة</th>
                <th>المشرف</th>
                <th>عمولة المشرف</th>
              </tr>
            </thead>
            <tbody>
              ${tableContent}
              <tr class="total-row">
                <td colspan="7" style="text-align: left;">الإجمالي الكلي</td>
                <td style="text-align: center; direction: ltr;">${formatNumber(selectedArchive.total_commission, 2)}</td>
                <td></td>
                <td style="text-align: center; direction: ltr;">${formatNumber(selectedArchive.total_supervisors_commission, 2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>تم استخراج هذا التقرير من أرشيف نظام إدارة العمولات</p>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const syncNewBranches = async (extractedNames: string[]) => {
    try {
      // Fetch latest branches from DB to avoid stale state and unique constraint errors
      const { data: latestBranches, error: fetchError } = await supabase
        .from('commission_branches')
        .select('name');
      
      if (fetchError) throw fetchError;

      const branchesToMatch = latestBranches || [];
      const existingNormalized = new Set(branchesToMatch.map(b => normalizeArabic(b.name || '')));
      const newBranchesToInsert: { name: string }[] = [];
      const addedNormalized = new Set<string>();

      extractedNames.forEach(name => {
        const norm = normalizeArabic(name);
        if (norm && !existingNormalized.has(norm) && !addedNormalized.has(norm)) {
          newBranchesToInsert.push({ 
            name: name,
            normalized_name: norm 
          });
          addedNormalized.add(norm);
        }
      });

      if (newBranchesToInsert.length > 0) {
        const { data, error } = await supabase
          .from('commission_branches')
          .insert(newBranchesToInsert)
          .select();
        
        if (error) throw error;
        if (data) {
          setDbBranches(prev => [...prev, ...data].sort((a, b) => a.name.localeCompare(b.name, 'ar')));
        }
      }
    } catch (err: any) {
      console.error('Error syncing new branches:', err.message || err);
    }
  };

  const fetchData = async () => {
    setIsDbLoading(true);
    try {
      const { data: branches } = await supabase.from('commission_branches').select('*').order('name');
      const { data: supervisors } = await supabase.from('commission_supervisors').select('*').order('name');
      const { data: assignments } = await supabase.from('commission_branch_assignments').select('*');

      setDbBranches(branches || []);
      setDbSupervisors(supervisors || []);
      setDbAssignments(assignments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update calculations when dependencies change
  useEffect(() => {
    if (data2024.length > 0 && data2025.length > 0) {
      performCalculations(data2024, data2025);
    }
  }, [dbBranches, dbAssignments, dbSupervisors, selectedMonth, data2024, data2025]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Detect Years from sheet names
        const sheetNames = workbook.SheetNames;
        const years = sheetNames
          .filter(name => /^\d{4}$/.test(name))
          .map(Number)
          .sort((a, b) => a - b);

        if (years.length < 2) {
          alert('يجب أن يحتوي الملف على ورقتين بأسماء سنوات (مثلاً 2024 و 2025)');
          setIsLoading(false);
          return;
        }

        const prevYear = years[years.length - 2];
        const currYear = years[years.length - 1];
        setYearPrev(prevYear);
        setYearCurr(currYear);

        const sheetPrev = workbook.Sheets[String(prevYear)];
        const sheetCurr = workbook.Sheets[String(currYear)];

        const jsonPrev = XLSX.utils.sheet_to_json(sheetPrev, { header: 1 }) as any[][];
        const jsonCurr = XLSX.utils.sheet_to_json(sheetCurr, { header: 1 }) as any[][];

        // Process Sheets with Normalization for matching keys
        const processSheet = (rows: any[][]) => {
          return rows.slice(1).map(row => {
            const rawName = String(row[1] || '').trim();
            return {
              branchName: rawName,
              normalizedName: normalizeArabic(rawName),
              sales: parseFloat(row[2]) || 0
            };
          }).filter(item => item.branchName);
        };

        const cleanPrev = processSheet(jsonPrev);
        const cleanCurr = processSheet(jsonCurr);

        setData2024(cleanPrev);
        setData2025(cleanCurr);
        
        // Sync new branches found in the file
        const allExtractedNames = Array.from(new Set([
          ...cleanPrev.map(b => b.branchName),
          ...cleanCurr.map(b => b.branchName)
        ]));
        await syncNewBranches(allExtractedNames);
        
        // Calculate logic
        performCalculations(cleanPrev, cleanCurr);
        
        // Archive the upload
        await saveUploadToArchive(file.name, cleanPrev, cleanCurr);
        
        setIsLoading(false);
        setSearchTerm('');
      } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء قراءة الملف');
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const saveUploadToArchive = async (originalFileName: string, c2024: any[], c2025: any[]) => {
    try {
      const timestamp = new Date().toLocaleString('ar-EG', { hour12: false }).replace(/[/:]/g, '-');
      const archiveFileName = `[رفع ملف] ${originalFileName} (${timestamp})`;
      
      const { data: archive, error: archiveError } = await supabase
        .from('commission_archives')
        .insert({
          filename: archiveFileName,
          total_commission: 0,
          total_supervisors_commission: 0
        })
        .select()
        .single();

      if (archiveError) throw archiveError;

      const data24Map = new Map(c2024.map(item => [item.normalizedName, item.sales]));
      const archiveItems = c2025.map(item25 => {
        const sales24 = data24Map.get(item25.normalizedName) || 0;
        const sales25 = item25.sales;
        return {
          archive_id: archive.id,
          branch_name: item25.branchName,
          sales_2024: sales24,
          sales_2025: sales25,
          growth: sales24 !== 0 ? ((sales25 / sales24) - 1) * 100 : 0,
          rate: 0,
          commission: 0,
          supervisor_names: '---',
          supervisor_commission: 0
        };
      });

      await supabase.from('commission_archive_items').insert(archiveItems);
    } catch (err) {
      console.error('Error saving upload to archive:', err);
    }
  };

  const performCalculations = (c2024: any[], c2025: any[]) => {
    const data24Map = new Map(c2024.map(item => [item.normalizedName, item.sales]));
    
    const results: CalculatedData[] = c2025.map((item25, index) => {
      const sales25 = item25.sales;
      const sales24 = data24Map.get(item25.normalizedName);
      
      const branchInfo = dbBranches.find(b => normalizeArabic(b.name) === item25.normalizedName);
      const isSplit = branchInfo?.opening_day && branchInfo?.opening_month === selectedMonth;
      
      // A branch is considered new if it didn't exist in 2024 OR if its sales were 0
      const isNew = (sales24 === undefined || sales24 === 0) && !isSplit;
      
      let difference = 0;
      let growth = 0;
      let rate = 0;
      let commission = 0;

      if (isSplit) {
        // For split branches, we wait for manual entry of splitSalesP1. 
        // Initially we set it to 0 or a proportional default if desired.
        // Let's set it to 0 initially and let the user edit it.
        difference = sales25 - (sales24 || 0);
        growth = (sales24 && sales24 !== 0) ? ((sales25 / sales24) - 1) * 100 : 0;
        rate = 0; // Will be recalculated after manual entry
        commission = 0;
      } else if (isNew) {
        difference = sales25;
        growth = 100;
        rate = calculateCommissionRate(0, true, item25.branchName);
        commission = sales25 * rate;
      } else {
        difference = sales25 - sales24!;
        growth = sales24 !== 0 ? ((sales25 / sales24!) - 1) * 100 : 0;
        growth = parseFloat(growth.toFixed(2));
        rate = difference < 0 ? 0 : calculateCommissionRate(growth, false, item25.branchName);
        commission = sales25 * rate;
      }

      return {
        id: index + 1,
        branchName: item25.branchName,
        sales2024: sales24 || 0,
        sales2025: sales25,
        difference,
        growth,
        rate,
        commission,
        isNew,
        isSplit,
        openingDay: branchInfo?.opening_day,
        splitSalesP1: 0
      };
    });

    setCalculatedData(results);
  };

  const handleSaveBranch = async () => {
    if (!modalBranchName.trim()) return;
    try {
      let branchId = editingBranch?.id;
      if (branchId) {
        await supabase.from('commission_branches').update({ 
          name: modalBranchName, 
          normalized_name: normalizeArabic(modalBranchName),
          opening_day: modalBranchOpeningDay === '' ? null : modalBranchOpeningDay,
          opening_month: modalBranchOpeningMonth === '' ? null : modalBranchOpeningMonth
        }).eq('id', branchId);
      } else {
        const { data, error } = await supabase.from('commission_branches').insert({ 
          name: modalBranchName, 
          normalized_name: normalizeArabic(modalBranchName),
          opening_day: modalBranchOpeningDay === '' ? null : modalBranchOpeningDay,
          opening_month: modalBranchOpeningMonth === '' ? null : modalBranchOpeningMonth
        }).select().single();
        if (error) throw error;
        branchId = data.id;
      }

      // Sync supervisors for this branch
      await supabase.from('commission_branch_assignments').delete().eq('branch_id', branchId);
      if (modalBranchSupervisors.length > 0) {
        await supabase.from('commission_branch_assignments').insert(
          modalBranchSupervisors
            .filter(s => s.id)
            .map(s => ({ branch_id: branchId, supervisor_id: s.id, share: s.share }))
        );
      }

      await fetchData();
      setIsBranchModalOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error(error);
      alert('خطأ أثناء حفظ الفرع');
    }
  };

  const handleSaveSupervisor = async () => {
    if (!modalSupervisorName.trim()) return;
    try {
      if (editingSupervisor?.id) {
        await supabase.from('commission_supervisors').update({ name: modalSupervisorName }).eq('id', editingSupervisor.id);
      } else {
        await supabase.from('commission_supervisors').insert({ name: modalSupervisorName });
      }
      await fetchData();
      setIsSupervisorModalOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error(error);
      alert('خطأ أثناء حفظ المشرف');
    }
  };



  // Enrich results with supervisor info for the results tab
  // Enhanced calculation for Results Tab using Database State
  const enrichedResults = useMemo(() => {
    return calculatedData.map(row => {
      const branchObj = dbBranches.find(b => normalizeArabic(b.name) === normalizeArabic(row.branchName));
      const assignments = branchObj ? dbAssignments.filter(a => a.branch_id === branchObj.id) : [];
      
      const supervisorNames = assignments.length > 0 
        ? assignments.map(a => dbSupervisors.find(s => s.id === a.supervisor_id)?.name || 'مجهول').join(' + ')
        : '---';

      return {
        ...row,
        supervisorNames,
        supervisorCommission10: row.commission * 0.10,
        assignments,
        primarySupervisorId: assignments.length > 0 ? assignments[0].supervisor_id : null
      };
    });
  }, [calculatedData, dbBranches, dbSupervisors, dbAssignments]);

  // Map database data to supervisorCalculations for the summary cards
  const supervisorCalculations = useMemo(() => {
    return dbSupervisors.map(sup => {
      const assignments = dbAssignments.filter(a => a.supervisor_id === sup.id);
      let supervisorCommission = 0;
      let totalGroupCommission = 0;
      let branchesCount = 0;

      assignments.forEach(assign => {
        const branchObj = dbBranches.find(b => b.id === assign.branch_id);
        if (branchObj) {
          branchesCount++;
          const calcRow = calculatedData.find(r => normalizeArabic(r.branchName) === normalizeArabic(branchObj.name));
          if (calcRow) {
            totalGroupCommission += calcRow.commission;
            supervisorCommission += calcRow.commission * 0.10 * assign.share;
          }
        }
      });

      const share = assignments.length > 0 ? assignments[0].share : 0;

      return {
        name: sup.name,
        totalGroupCommission,
        supervisorCommission,
        branchesCount,
        share,
        id: sup.id
      };
    });
  }, [calculatedData, dbBranches, dbSupervisors, dbAssignments]);

  const filteredData2025 = useMemo(() => {
    return data2025.filter(row => row.branchName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data2025, searchTerm]);

  const filteredResults = useMemo(() => {
    let sorted = [...enrichedResults];
    
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue, 'ar') 
            : bValue.localeCompare(aValue, 'ar');
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sorted.filter(row => {
      // 1. Category Filter
      if (activeFilterType === 'new' && !row.isNew) return false;
      if (activeFilterType === 'partial' && !row.isSplit) return false;
      if (activeFilterType === 'zero-sales' && row.sales2025 !== 0) return false;
      if (activeFilterType === 'no-sales' && (!row.isSplit || row.sales2025 !== 0)) {
        // Special logic for partial branches missing sales
        if (activeFilterType === 'no-sales') {
          const hasOpening = row.isSplit;
          const noSales = row.sales2025 === 0;
          if (!(hasOpening && noSales)) return false;
        }
      }

      // 2. Search Filter (Name or Supervisor)
      return row.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             row.supervisorNames.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [enrichedResults, searchTerm, sortConfig, activeFilterType]);

  const filteredBranches = useMemo(() => {
    let filtered = [...dbBranches];
    
    if (activeFilterType === 'no-supervisor') {
      filtered = filtered.filter(b => !dbAssignments.some(a => a.branch_id === b.id));
    }

    filtered = filtered.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return filtered.sort((a, b) => {
      const aAssignments = dbAssignments.filter(as => as.branch_id === a.id);
      const bAssignments = dbAssignments.filter(as => as.branch_id === b.id);
      
      const aSupId = aAssignments.length > 0 ? aAssignments[0].supervisor_id : null;
      const bSupId = bAssignments.length > 0 ? bAssignments[0].supervisor_id : null;
      
      const aSupName = aSupId ? dbSupervisors.find(s => s.id === aSupId)?.name || 'zzz' : 'zzz';
      const bSupName = bSupId ? dbSupervisors.find(s => s.id === bSupId)?.name || 'zzz' : 'zzz';
      
      if (aSupName === bSupName) {
        return a.name.localeCompare(b.name, 'ar');
      }
      return aSupName.localeCompare(bSupName, 'ar');
    });
  }, [dbBranches, dbAssignments, dbSupervisors, searchTerm, activeFilterType]);

  const filteredSupervisors = useMemo(() => {
    return supervisorCalculations.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [supervisorCalculations, searchTerm]);

  // Results Totals
  const resultsTotals = useMemo(() => {
    return filteredResults.reduce((acc, curr) => ({
      sales2024: acc.sales2024 + curr.sales2024,
      sales2025: acc.sales2025 + curr.sales2025,
      commission: acc.commission + curr.commission
    }), { sales2024: 0, sales2025: 0, commission: 0 });
  }, [filteredResults]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 w-full mx-auto px-2 md:px-3 pb-3 transition-all duration-500" dir="rtl">
      <header className="py-2 flex justify-between items-center border-b border-slate-200 dark:border-slate-800/50 mb-2 transition-colors duration-500 relative z-50">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-right"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1 uppercase tracking-tight">
            إدارة العمولات
          </h1>
          <p className="text-slate-600 dark:text-slate-500 text-[13px] font-bold">نظام تحليل المبيعات واحتساب عمولات الفروع والمشرفين بدقة متناهية</p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          {(() => {
            // 1. Branches in DB that have no supervisor assigned (Configuration alert)
            const noSupInDb = dbBranches.filter(b => !dbAssignments.some(a => a.branch_id === b.id));
            
            // 2. Sales-related alerts (Operational alerts)
            const partialNoSales = calculatedData.length > 0 ? enrichedResults.filter(r => r.isSplit && !r.splitSalesP1) : [];
            const zeroSales = calculatedData.length > 0 ? enrichedResults.filter(r => r.sales2025 === 0) : [];
            
            const totalAlerts = noSupInDb.length + partialNoSales.length + zeroSales.length;

            return (
              <div className="relative">
                <button 
                  onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                  onMouseEnter={() => setIsAlertsOpen(true)}
                  className="relative h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-400 shadow-sm transition-all duration-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 hover:border-amber-200"
                >
                  <Bell size={20} className={totalAlerts > 0 ? "animate-pulse text-amber-500" : ""} />
                  {totalAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950">
                      {totalAlerts}
                    </span>
                  )}
                </button>
                
                <AnimatePresence>
                  {isAlertsOpen && totalAlerts > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      onMouseLeave={() => setIsAlertsOpen(false)}
                      className="absolute left-0 top-12 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">تنبيهات وإجراءات مطلوبة</h3>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {noSupInDb.length > 0 && (
                          <button onClick={() => { setIsAlertsOpen(false); navigateTo('branches', '', 'no-supervisor'); }} className="w-full text-right p-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex justify-between items-center group">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">فروع بلا مشرفين (في النظام)</span>
                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold english-nums">{noSupInDb.length}</span>
                          </button>
                        )}
                        {partialNoSales.length > 0 && (
                          <button onClick={() => { setIsAlertsOpen(false); navigateTo('results', '', 'partial'); }} className="w-full text-right p-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex justify-between items-center group">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">فروع الافتتاح الجزئي</span>
                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold english-nums">{partialNoSales.length}</span>
                          </button>
                        )}
                        {zeroSales.length > 0 && (
                          <button onClick={() => { setIsAlertsOpen(false); navigateTo('results', '', 'zero-sales'); }} className="w-full text-right p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex justify-between items-center group">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-rose-700 dark:group-hover:text-rose-400">فروع مبيعاتها صفر</span>
                            <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 px-2 py-0.5 rounded-full text-xs font-bold english-nums">{zeroSales.length}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}
          <ThemeToggle />
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-400 shadow-sm transition-colors duration-500">
            <Calculator size={20} />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-2">
        {/* Sidebar (Right - Flexible) */}
        <aside className={`w-full ${isSidebarPinned ? 'lg:w-72' : 'lg:w-20 hover:lg:w-72'} flex-shrink-0 transition-all duration-500 group/sidebar z-50 order-1`}>
          <div className="sticky top-6 flex flex-col gap-4 overflow-hidden">
            {/* Navigation Tabs */}
          <nav className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 rounded-md shadow-xl flex flex-col gap-1 transition-colors duration-500">
            <button 
              onClick={() => setIsSidebarPinned(!isSidebarPinned)}
              className={`hidden lg:flex items-center justify-start px-2 py-1.5 mb-0.5 rounded-sm transition-all duration-300 relative group/pin ${
                isSidebarPinned 
                  ? 'text-emerald-500' 
                  : 'text-slate-400 hover:text-emerald-500'
              }`}
              title={isSidebarPinned ? 'إلغاء تثبيت القائمة' : 'تثبيت القائمة'}
            >
              <div className="flex-shrink-0">
                {isSidebarPinned ? <Lock size={18} strokeWidth={2.5} /> : <Unlock size={18} />}
              </div>
            </button>

            {[
              { id: 'dashboard', label: 'لوحة البيانات', icon: LayoutDashboard },
              { id: 'upload', label: 'رفع البيانات', icon: Upload },
              { id: 'results', label: 'النتائج', icon: Calculator },
              { id: 'archive', label: 'الأرشيف', icon: Archive },
              { id: 'branches', label: 'الفروع', icon: FileSpreadsheet },
              { id: 'supervisors', label: 'المشرفين', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                  setActiveFilterType('all');
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-sm transition-all duration-300 relative whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex-shrink-0">
                  <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                </div>
                <span className={`font-bold text-sm lg:opacity-0 ${isSidebarPinned ? 'lg:opacity-100' : 'group-hover/sidebar:opacity-100'} transition-all duration-300`}>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-white rounded-l-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

        {/* Main Content Area (Left) */}
        <div className="flex-1 w-full order-2">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-4 transition-colors duration-500">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-full shadow-sm w-fit">
                  <div className="p-2 bg-blue-600/10 rounded-full text-blue-600 dark:text-blue-400">
                    <LayoutDashboard size={20} />
                  </div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 ml-4">لوحة البيانات</h2>
                  
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => setIsAmountsHidden(!isAmountsHidden)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                      title={isAmountsHidden ? 'إظهار المبالغ' : 'إخفاء المبالغ'}
                    >
                      {isAmountsHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={() => navigateTo('upload')} 
                      className="p-1.5 hover:bg-blue-600/10 rounded-full text-blue-600 transition-colors"
                      title="رفع بيانات"
                    >
                      <Upload size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {calculatedData.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-md p-12 text-center shadow-xl">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد بيانات للعرض</h3>
                  <p className="text-slate-500 dark:text-slate-500 mb-6 max-w-md mx-auto">قم برفع ملف مبيعات جديد لعرض التحليلات والمؤشرات في لوحة البيانات.</p>
                  <button onClick={() => navigateTo('upload')} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-md inline-flex items-center gap-2 transition-all shadow-lg font-bold">
                    <Upload size={20} />
                    الذهاب لرفع البيانات
                  </button>
                </div>
              ) : (
                <>
                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-5 rounded-md shadow-lg transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-300 dark:bg-slate-700 opacity-50" />
                      <p className="text-xs text-slate-500 uppercase font-bold mb-2">إجمالي مبيعات {yearPrev}</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white english-nums transition-all duration-300">
                        {isAmountsHidden ? '••••••••' : formatNumber(resultsTotals.sales2024)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-5 rounded-md shadow-lg transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 opacity-50" />
                      <p className="text-xs text-slate-500 uppercase font-bold mb-2">إجمالي مبيعات {yearCurr}</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-black text-slate-800 dark:text-white english-nums transition-all duration-300">
                          {isAmountsHidden ? '••••••••' : formatNumber(resultsTotals.sales2025)}
                        </p>
                        {(() => {
                           const overallGrowth = resultsTotals.sales2024 !== 0 ? ((resultsTotals.sales2025 / resultsTotals.sales2024) - 1) * 100 : 0;
                           return (
                             <span className={`text-xs font-bold px-2 py-1 rounded-sm english-nums flex items-center gap-1 ${overallGrowth >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                               {overallGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                               {formatNumber(overallGrowth, 2)}%
                             </span>
                           );
                        })()}
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-md shadow-lg transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 opacity-50" />
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase font-bold">إجمالي عمولات الفروع</p>
                        <div className="p-1.5 bg-emerald-500/10 rounded-sm text-emerald-600"><Award size={14} /></div>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 english-nums transition-all duration-300">
                          {isAmountsHidden ? '••••••••' : formatNumber(resultsTotals.commission, 2)}
                        </p>
                        <p className="text-[10px] text-emerald-600/70 font-bold">
                          {formatNumber((resultsTotals.commission / (resultsTotals.sales2025 || 1)) * 100, 2)}% من المبيعات
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#800000]/5 dark:bg-blue-600/10 border border-[#800000]/20 dark:border-blue-500/20 p-5 rounded-md shadow-lg transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-[#800000] dark:bg-blue-500 opacity-50" />
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-[#800000] dark:text-blue-400 uppercase font-bold">إجمالي عمولات المشرفين</p>
                        <div className="p-1.5 bg-[#800000]/10 dark:bg-blue-500/10 rounded-sm text-[#800000] dark:text-blue-400"><Users size={14} /></div>
                      </div>
                      <p className="text-2xl font-black text-[#800000] dark:text-blue-400 english-nums transition-all duration-300">
                        {isAmountsHidden ? '••••••••' : formatNumber(supervisorCalculations.reduce((acc, s) => acc + s.supervisorCommission, 0), 2)}
                      </p>
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Top Sales */}
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-lg overflow-hidden flex flex-col group transition-all duration-500 max-h-[46px] hover:max-h-[350px]">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-800 flex justify-between items-center cursor-default h-[46px] shrink-0">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={18} className="text-blue-500" />
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">الأعلى مبيعاً</h3>
                        </div>
                        <ChevronDown size={16} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/50 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        {[...enrichedResults].sort((a, b) => b.sales2025 - a.sales2025).slice(0, 5).map((branch, idx) => (
                          <button key={branch.id} onClick={() => navigateTo('results', branch.branchName, 'branch')} className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[150px]">{branch.branchName}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white english-nums">
                              {isAmountsHidden ? '••••' : formatNumber(branch.sales2025)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Top Growth */}
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-lg overflow-hidden flex flex-col group transition-all duration-500 max-h-[46px] hover:max-h-[350px]">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-800 flex justify-between items-center cursor-default h-[46px] shrink-0">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={18} className="text-emerald-500" />
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">الأعلى نمواً (%)</h3>
                        </div>
                        <ChevronDown size={16} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/50 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        {[...enrichedResults].filter(b => b.sales2024 > 0).sort((a, b) => b.growth - a.growth).slice(0, 5).map((branch, idx) => (
                          <button key={branch.id} onClick={() => navigateTo('results', branch.branchName, 'branch')} className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[150px]">{branch.branchName}</span>
                            </div>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 english-nums">
                              +{formatNumber(branch.growth, 1)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Needs Attention (Bottom Growth) */}
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-lg overflow-hidden flex flex-col group transition-all duration-500 max-h-[46px] hover:max-h-[350px]">
                      <div className="bg-rose-50 dark:bg-rose-900/10 p-3 border-b border-transparent group-hover:border-rose-200 dark:group-hover:border-rose-900/30 flex justify-between items-center cursor-default h-[46px] shrink-0">
                        <div className="flex items-center gap-2">
                          <TrendingDown size={18} className="text-rose-500" />
                          <h3 className="font-bold text-sm text-rose-800 dark:text-rose-300">أكبر تراجع (يحتاج انتباه)</h3>
                        </div>
                        <ChevronDown size={16} className="text-rose-400 group-hover:rotate-180 transition-transform duration-300" />
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/50 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        {[...enrichedResults].filter(b => b.sales2024 > 0).sort((a, b) => a.growth - b.growth).slice(0, 5).map((branch, idx) => (
                          <button key={branch.id} onClick={() => navigateTo('results', branch.branchName, 'branch')} className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors truncate max-w-[150px]">{branch.branchName}</span>
                            </div>
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400 english-nums">
                              {formatNumber(branch.growth, 1)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Special Branches & Supervisors */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Special Branches */}
                    <div className="lg:col-span-1 space-y-4">
                      {(() => {
                        const newBranches = enrichedResults.filter(r => r.isNew);
                        const partialBranches = enrichedResults.filter(r => r.isSplit);
                        return (
                          <>
                            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-4 rounded-md shadow-md">
                              <button 
                                onClick={() => navigateTo('results', '', 'new')}
                                className="flex justify-between items-center mb-3 w-full group/h"
                              >
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover/h:text-blue-600 transition-colors">فروع جديدة</h3>
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold english-nums">{newBranches.length}</span>
                              </button>
                              <div className="flex flex-wrap gap-1.5">
                                {newBranches.slice(0, 10).map(b => (
                                  <button key={b.id} onClick={() => navigateTo('results', b.branchName, 'branch')} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors truncate max-w-[100px]">{b.branchName}</button>
                                ))}
                                {newBranches.length > 10 && <span className="text-[10px] text-slate-400 px-2 py-1">+{newBranches.length - 10}</span>}
                                {newBranches.length === 0 && <span className="text-xs text-slate-400">لا يوجد فروع جديدة</span>}
                              </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-4 rounded-md shadow-md">
                              <button 
                                onClick={() => navigateTo('results', '', 'partial')}
                                className="flex justify-between items-center mb-3 w-full group/h"
                              >
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover/h:text-orange-600 transition-colors">افتتاح جزئي</h3>
                                <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 px-2 py-0.5 rounded-full text-xs font-bold english-nums">{partialBranches.length}</span>
                              </button>
                              <div className="flex flex-wrap gap-1.5">
                                {partialBranches.slice(0, 10).map(b => (
                                  <button key={b.id} onClick={() => navigateTo('results', b.branchName, 'branch')} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-sm hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-700 dark:hover:text-orange-300 transition-colors truncate max-w-[100px]">{b.branchName}</button>
                                ))}
                                {partialBranches.length > 10 && <span className="text-[10px] text-slate-400 px-2 py-1">+{partialBranches.length - 10}</span>}
                                {partialBranches.length === 0 && <span className="text-xs text-slate-400">لا يوجد فروع جزئية</span>}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Supervisors Summary */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-lg overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-slate-500" />
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">ملخص المشرفين</h3>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {supervisorCalculations.filter(s => s.branchesCount > 0).sort((a,b) => b.supervisorCommission - a.supervisorCommission).map(sup => {
                          const supColor = supervisorColorMap[sup.id];
                          const supsBranchesNames = enrichedResults.filter(r => r.primarySupervisorId === sup.id).map(r => r.branchName).join('، ');
                          return (
                            <button 
                              key={sup.id}
                              title={`الفروع: ${supsBranchesNames}`}
                              onClick={() => navigateTo('results', sup.name, 'supervisor')}
                              className={`text-right p-3 rounded-md border ${supColor ? supColor.border : 'border-slate-200 dark:border-slate-700'} ${supColor ? supColor.hover : 'hover:border-blue-500'} bg-slate-50 dark:bg-slate-900/50 transition-colors group relative overflow-hidden`}
                            >
                              {supColor && <div className={`absolute right-0 top-0 w-1 h-full ${supColor.accent} opacity-30`} />}
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{sup.name}</p>
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700">
                                  {sup.branchesCount} فروع
                                </span>
                                <span className={`text-sm font-black english-nums ${supColor ? supColor.text : 'text-slate-700 dark:text-slate-300'}`}>
                                  {isAmountsHidden ? '••••' : formatNumber(sup.supervisorCommission)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-4 transition-colors duration-500">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-full shadow-sm w-fit">
                  <button onClick={() => navigateTo('dashboard')} title="العودة للوحة البيانات" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                    <ArrowRight size={18} />
                  </button>
                  <div className="p-2 bg-blue-600/10 rounded-full text-blue-600 dark:text-blue-400">
                    <Upload size={20} />
                  </div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 ml-4">رفع وتحديث البيانات</h2>
                </div>
              </div>

              <div className="flex justify-start">
                <motion.div
                  key="upload-box"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md p-4 text-center shadow-2xl transition-colors duration-500 w-full min-w-[320px] max-w-[450px]"
                >
                  <div className="w-16 h-16 bg-blue-600/5 dark:bg-blue-600/10 rounded-md flex items-center justify-center mx-auto mb-2 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Upload size={28} />
                  </div>
                  <h2 className="text-lg font-bold mb-1 text-slate-800 dark:text-slate-100">رفع وتحديث بيانات المبيعات</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed text-[10px]">
                    تأكد من أن الملف يحتوي على ورقتين بأسماء سنوات متتالية (مثلاً 2024 و 2025). 
                  </p>
                  
                  <div className="flex flex-col gap-3 mb-2">
                    <div className="w-full">
                      <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-4 py-2.5 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-xs"
                      >
                        {[
                          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                        ].map((m, i) => (
                          <option key={i+1} value={i+1}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <label className="w-full relative group cursor-pointer block">
                      <div className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 text-xs">
                        {isLoading ? 'جاري المعالجة...' : 'اختيار ملف الإكسل'}
                        <Plus size={16} />
                      </div>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                  
                  {fileName && (
                    <div className="flex items-center justify-center gap-2 text-green-500 text-[13px] font-bold">
                      <CheckCircle2 size={16} />
                      <span>تم رفع: {fileName}</span>
                    </div>
                  )}
                </motion.div>
              </div>

              {(data2024.length > 0 || data2025.length > 0) && (
                <motion.div
                  key="data-tables"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md p-3 h-fit shadow-2xl transition-colors duration-500">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-sm text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        <FileSpreadsheet size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">بيانات {yearPrev}</h3>
                    </div>
                    <div className="overflow-auto max-h-[400px] custom-scrollbar rounded-md border border-slate-200 dark:border-slate-800/50">
                      <div className="grid grid-cols-[50px_1fr_100px] gap-0 text-slate-500 text-xs border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold sticky top-0 z-10 transition-colors">
                        <div className="p-2 text-center border-l border-slate-200 dark:border-slate-800">م</div>
                        <div className="p-2 text-right border-l border-slate-200 dark:border-slate-800">الفرع</div>
                        <div className="p-2 text-right">المبيعات</div>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800/50 bg-white dark:bg-slate-900/20">
                        {data2024.filter(r => r.branchName.toLowerCase().includes(searchTerm.toLowerCase())).map((row, i) => (
                          <div key={i} className="grid grid-cols-[50px_1fr_100px] gap-0 items-center text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="p-2 text-center border-l border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/10 font-mono english-nums text-slate-400 dark:text-slate-500">{i + 1}</div>
                            <div className="p-2 text-right border-l border-slate-200 dark:border-slate-800/50 truncate">{row.branchName}</div>
                            <div className="p-2 text-right font-mono english-nums text-slate-600 dark:text-slate-400">{formatNumber(row.sales)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md p-3 h-fit shadow-2xl transition-colors duration-500">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-600/5 dark:bg-blue-600/10 rounded-sm text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <FileSpreadsheet size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">بيانات {yearCurr}</h3>
                    </div>
                    <div className="overflow-auto max-h-[400px] custom-scrollbar rounded-md border border-slate-200 dark:border-slate-800/50">
                      <div className="grid grid-cols-[50px_1fr_100px] gap-0 text-slate-500 text-xs border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold sticky top-0 z-10 transition-colors">
                        <div className="p-2 text-center border-l border-slate-200 dark:border-slate-800">م</div>
                        <div className="p-2 text-right border-l border-slate-200 dark:border-slate-800">الفرع</div>
                        <div className="p-2 text-right">المبيعات</div>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800/50 bg-white dark:bg-slate-900/20">
                        {filteredData2025.map((row, i) => (
                          <div key={i} className="grid grid-cols-[50px_1fr_100px] gap-0 items-center text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="p-2 text-center border-l border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/10 font-mono english-nums text-slate-400 dark:text-slate-500">{i + 1}</div>
                            <div className="p-2 text-right border-l border-slate-200 dark:border-slate-800/50 truncate">{row.branchName}</div>
                            <div className="p-2 text-right font-mono english-nums text-slate-600 dark:text-slate-400">{formatNumber(row.sales)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md p-4 overflow-hidden shadow-2xl transition-colors duration-500"
            >
              <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-4 transition-colors duration-500">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-full shadow-sm w-fit">
                  <button onClick={() => navigateTo('dashboard')} title="العودة للوحة البيانات" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                    <ArrowRight size={18} />
                  </button>
                  <div className="p-2 bg-blue-600/10 rounded-full text-blue-600 dark:text-blue-400">
                    <Calculator size={20} />
                  </div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 ml-4">تقرير العمولات المحتسبة</h2>
                  
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
                    {(activeFilterType !== 'all' || searchTerm) && (
                      <div className="flex items-center gap-2 bg-blue-600/10 dark:bg-blue-400/10 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400 animate-in fade-in zoom-in duration-300">
                        <span>{
                          activeFilterType === 'new' ? `الفروع الجديدة ${searchTerm ? `(${searchTerm})` : ''}` : 
                          activeFilterType === 'partial' ? `افتتاح جزئي ${searchTerm ? `(${searchTerm})` : ''}` :
                          activeFilterType === 'no-sales' ? 'بيانات مفقودة' :
                          activeFilterType === 'zero-sales' ? 'مبيعات صفر' :
                          activeFilterType === 'supervisor' ? searchTerm : 
                          activeFilterType === 'branch' ? searchTerm :
                          searchTerm ? `بحث: ${searchTerm}` : ''
                        }</span>
                        <button onClick={() => { setActiveFilterType('all'); setSearchTerm(''); }} className="hover:text-blue-800 dark:hover:text-blue-200">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="relative flex items-center">
                      <Search className="absolute right-2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="بحث..." 
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if (activeFilterType === 'supervisor') setActiveFilterType('all');
                        }}
                        className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-full pr-8 pl-8 py-1 text-xs w-32 focus:w-48 transition-all focus:ring-1 focus:ring-blue-500/30"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute left-2 text-slate-400 hover:text-slate-600">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <button 
                      title="تصدير النتائج"
                      onClick={handleExportAndArchive}
                      className="p-2 hover:bg-blue-600/10 rounded-full text-blue-600 transition-colors"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      title="طباعة التقرير"
                      onClick={handlePrintResults}
                      className="p-2 hover:bg-blue-600/10 rounded-full text-blue-600 transition-colors"
                    >
                      <Printer size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-4 max-w-4xl">
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-md transition-colors flex-1">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">إجمالي مبيعات {yearPrev}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white english-nums">{formatNumber(resultsTotals.sales2024)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-md transition-colors border-r-4 border-r-blue-500/50 flex-1">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">إجمالي مبيعات {yearCurr}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white english-nums">{formatNumber(resultsTotals.sales2025)}</p>
                </div>
                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-md transition-colors border-r-4 border-r-emerald-500 flex-1">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-2">إجمالي العمولات</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 english-nums">{formatNumber(resultsTotals.commission, 2)}</p>
                </div>
                {searchTerm && dbSupervisors.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) && (
                  <div className="bg-[#800000]/5 dark:bg-[#800000]/10 border border-[#800000]/20 p-3 rounded-md transition-colors border-r-4 border-r-[#800000] flex-[1.5] flex justify-between items-center">
                    <div>
                      <p className="text-xs text-[#800000] dark:text-rose-400 uppercase font-bold mb-2">عمولة المشرف (للفلتر)</p>
                      <p className="text-2xl font-black text-[#800000] dark:text-rose-400 english-nums">{formatNumber(filteredResults.reduce((acc, row) => acc + row.supervisorCommission10, 0), 2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-auto max-h-[calc(100vh-350px)] custom-scrollbar rounded-sm border border-slate-200 dark:border-slate-800/50 transition-colors">
                <div className="min-w-[1400px]">
                  <div className="grid grid-cols-[60px_1.2fr_120px_120px_120px_90px_90px_120px_1.2fr_130px] gap-0 text-[13px] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 transition-colors">
                    <div className="p-3 text-center border-l border-slate-200 dark:border-slate-800">م</div>
                    {[
                      { key: 'branchName', label: 'اسم الفرع' },
                      { key: 'sales2024', label: String(yearPrev) },
                      { key: 'sales2025', label: String(yearCurr) },
                      { key: 'difference', label: 'الفارق' },
                      { key: 'growth', label: 'النمو' },
                      { key: 'rate', label: 'العمولة %' },
                      { key: 'commission', label: 'القيمة' },
                      { key: 'supervisorNames', label: 'المشرف' },
                    ].map((col) => (
                      <button 
                        key={col.key}
                        onClick={() => requestSort(col.key)}
                        className="p-3 text-right border-l border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {col.label}
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp size={12} className={sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-500 dark:text-blue-400' : ''} />
                          <ChevronDown size={12} className={sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-500 dark:text-blue-400' : ''} />
                        </div>
                      </button>
                    ))}
                    <div className="p-3 text-right">عمولة المشرف</div>
                  </div>
                  
                  <div className="divide-y divide-slate-200 dark:divide-slate-800/30">
                    {filteredResults.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[60px_1.2fr_120px_120px_120px_90px_90px_120px_1.2fr_130px] gap-0 items-center text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group border-b border-slate-200 dark:border-slate-800/20">
                        <div className="p-3 text-center border-l border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/10 font-mono english-nums text-slate-400 dark:text-slate-500">{idx + 1}</div>
                        <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                          <span className="truncate">{row.branchName}</span>
                          {row.isNew && (
                            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] rounded-full border border-green-500/20 font-bold whitespace-nowrap">جديد</span>
                          )}
                          {row.isSplit && (
                            <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] rounded-full border border-orange-500/20 font-bold whitespace-nowrap">افتتاح جزئي</span>
                          )}
                        </div>
                        <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono english-nums text-slate-500 dark:text-slate-400">{formatNumber(row.sales2024)}</div>
                        <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono english-nums text-slate-700 dark:text-slate-300">{formatNumber(row.sales2025)}</div>
                        <div className={`p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono english-nums font-bold ${row.difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatNumber(row.difference)}
                        </div>
                        <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono text-blue-600 dark:text-blue-400 english-nums font-semibold">{formatNumber(row.growth, 2)}%</div>
                        <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-bold text-amber-600 dark:text-amber-400 english-nums">{formatNumber(row.rate * 100, 1)}%</div>
                        <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-bold text-slate-900 dark:text-slate-100 english-nums">{formatNumber(row.commission, 2)}</div>
                        <div className={`p-3 text-right border-l border-slate-200 dark:border-slate-800/50 ${row.primarySupervisorId ? supervisorColorMap[row.primarySupervisorId]?.text : 'text-blue-600 dark:text-blue-400'} font-bold truncate flex items-center justify-between group/edit`}>
                          <span className="truncate">{row.supervisorNames}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResult(row);
                              setEditSales2024(row.sales2024);
                              setEditSales2025(row.sales2025);
                              setEditSplitSalesP1(row.splitSalesP1 || 0);
                              setIsResultEditModalOpen(true);
                              setSearchTerm('');
                            }}
                            className="p-1.5 hover:bg-blue-600/20 rounded-sm text-blue-400 opacity-0 group-hover/edit:opacity-100 transition-all ml-1"
                            title="تعديل المبيعات"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                        <div className="p-3 text-right font-bold text-[#800000] dark:text-rose-400 english-nums transition-colors">
                          {formatNumber(row.supervisorCommission10, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'archive' && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-4 transition-colors duration-500">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-full shadow-sm w-fit">
                  <button onClick={() => navigateTo('dashboard')} title="العودة للوحة البيانات" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                    <ArrowRight size={18} />
                  </button>
                  <div className="p-2 bg-blue-600/10 rounded-full text-blue-600 dark:text-blue-400">
                    <Archive size={20} />
                  </div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 ml-4">الأرشيف</h2>
                  
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
                    <div className="relative flex items-center">
                      <Search className="absolute right-2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="بحث بالأرشيف..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-full pr-8 pl-8 py-1 text-xs w-32 focus:w-48 transition-all focus:ring-1 focus:ring-blue-500/30"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute left-2 text-slate-400 hover:text-slate-600">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              { !selectedArchive ? (
                <div className="flex justify-start w-full overflow-hidden">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Exported Results Section */}
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-xl transition-colors duration-500 w-full min-w-[320px] max-w-[450px]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-600/5 dark:bg-blue-600/10 rounded-sm text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <History size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">النتائج المصدرة</h3>
                      </div>
                      <div className="grid gap-2">
                        {archives.filter(a => !a.filename.startsWith('[رفع ملف]')).length > 0 ? (
                          archives.filter(a => !a.filename.startsWith('[رفع ملف]')).map((arc) => (
                            <div 
                              key={arc.id}
                              className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-sm flex items-center justify-between hover:border-blue-500/30 transition-all cursor-pointer group shadow-sm overflow-hidden min-w-0"
                              onClick={() => viewArchiveDetails(arc.id)}
                            >
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="w-12 h-12 flex-shrink-0 bg-blue-600/5 text-blue-600 dark:bg-slate-900 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-100 dark:border-transparent">
                                  <FileSpreadsheet size={24} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate" title={arc.filename}>{arc.filename}</h4>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(arc.created_at).toLocaleString('ar-EG')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">إجمالي العمولات</p>
                                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 english-nums">{formatNumber(arc.total_commission, 2)}</p>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteArchive(arc.id);
                                  }}
                                  className="p-3 hover:bg-rose-500/10 rounded-sm text-slate-400 dark:text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center text-slate-500 text-sm italic">لا توجد نتائج مصدرة</div>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Files Section */}
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-xl transition-colors duration-500 w-full min-w-[320px] max-w-[450px]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/5 dark:bg-amber-500/10 rounded-sm text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Upload size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">الملفات المرفوعة</h3>
                      </div>
                      <div className="grid gap-2">
                        {archives.filter(a => a.filename.startsWith('[رفع ملف]')).length > 0 ? (
                          archives.filter(a => a.filename.startsWith('[رفع ملف]')).map((arc) => (
                            <div 
                              key={arc.id}
                              className="bg-white dark:bg-slate-950/40 border border-amber-500/10 hover:border-amber-500/30 p-4 rounded-sm flex items-center justify-between transition-all cursor-pointer group shadow-sm overflow-hidden min-w-0"
                              onClick={() => viewArchiveDetails(arc.id)}
                            >
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="w-12 h-12 flex-shrink-0 bg-amber-500/5 text-amber-600 dark:bg-slate-900 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-100/50 dark:border-transparent">
                                  <Upload size={24} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate" title={arc.filename}>{arc.filename}</h4>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(arc.created_at).toLocaleString('ar-EG')}</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteArchive(arc.id);
                                }}
                                className="p-3 hover:bg-rose-500/10 rounded-sm text-slate-400 dark:text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center text-slate-500 text-sm italic">لا توجد ملفات مرفوعة</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-4 transition-colors duration-500">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-full shadow-sm w-fit">
                      <button 
                        onClick={() => setSelectedArchive(null)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                      >
                        <X size={20} />
                      </button>
                      <div className="pr-2 border-r border-slate-200 dark:border-slate-800 min-w-0 flex-1">
                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-[200px] md:max-w-[400px]" title={selectedArchive.filename}>{selectedArchive.filename}</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">بتاريخ {new Date(selectedArchive.created_at).toLocaleString('ar-EG')}</p>
                      </div>
                      
                      <div className="flex gap-6 pr-4 mr-2 border-r border-slate-200 dark:border-slate-800">
                        <div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">إجمالي الفروع</p>
                          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 english-nums text-sm">{formatNumber(selectedArchive.total_commission, 2)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">إجمالي المشرفين</p>
                          <p className="font-mono font-bold text-blue-600 dark:text-blue-400 english-nums text-sm">{formatNumber(selectedArchive.total_supervisors_commission, 2)}</p>
                        </div>
                        <div className="border-r border-slate-200 dark:border-slate-800 pr-4 mr-2">
                          <button 
                            title="طباعة الأرشيف"
                            onClick={handlePrintArchive}
                            className="p-2 hover:bg-blue-600/10 rounded-full text-blue-600 transition-colors"
                          >
                            <Printer size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md p-3 shadow-2xl overflow-hidden transition-colors duration-500">
                    <div className="overflow-auto max-h-[calc(100vh-400px)] custom-scrollbar rounded-md border border-slate-200 dark:border-slate-800/50">
                      <div className="min-w-[1400px]">
                        <div className="grid grid-cols-[60px_1.2fr_120px_120px_120px_90px_90px_120px_1.2fr_130px] gap-0 text-[13px] text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 transition-colors">
                          <div className="p-3 text-center border-l border-slate-200 dark:border-slate-800">م</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">الفرع</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">{yearPrev}</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">{yearCurr}</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">الفارق</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">النمو</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">العمولة %</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">القيمة</div>
                          <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800">المشرف</div>
                          <div className="p-3 text-right">عمولة المشرف</div>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-800/30">
                          {archiveDetails.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-[60px_1.2fr_120px_120px_120px_90px_90px_120px_1.2fr_130px] gap-0 items-center text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 border-b border-slate-200/50 dark:border-slate-800/20 transition-colors">
                              <div className="p-3 text-center border-l border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/10 font-mono english-nums text-slate-400 dark:text-slate-500">{idx + 1}</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-bold text-slate-800 dark:text-slate-100 truncate">{item.branch_name}</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono english-nums">{formatNumber(item.sales_2024)}</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono english-nums">{formatNumber(item.sales_2025)}</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono english-nums">{formatNumber(item.sales_2025 - item.sales_2024)}</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-mono english-nums">{formatNumber(item.growth, 2)}%</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-bold text-amber-600 dark:text-amber-400 english-nums">{formatNumber(item.rate * 100, 1)}%</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 font-bold text-slate-800 dark:text-slate-100 english-nums">{formatNumber(item.commission, 2)}</div>
                              <div className="p-3 text-right border-l border-slate-200 dark:border-slate-800/50 text-blue-600 dark:text-blue-400 font-bold truncate">{item.supervisor_names}</div>
                              <div className="p-3 text-right font-bold text-[#800000] dark:text-rose-400 english-nums transition-colors">{formatNumber(item.supervisor_commission, 2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'branches' && (
            <motion.div
              key="branches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-4 transition-colors duration-500">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-full shadow-sm w-fit">
                  <button onClick={() => navigateTo('dashboard')} title="العودة للوحة البيانات" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                    <ArrowRight size={18} />
                  </button>
                  <div className="p-2 bg-blue-600/10 rounded-full text-blue-600 dark:text-blue-400">
                    <FileSpreadsheet size={20} />
                  </div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 ml-4">إدارة الفروع</h2>
                  
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
                    {(activeFilterType !== 'all' || searchTerm) && (
                      <div className="flex items-center gap-2 bg-blue-600/10 dark:bg-blue-400/10 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400 animate-in fade-in zoom-in duration-300">
                        <span>{
                          activeFilterType === 'no-supervisor' ? 'فروع بلا مشرفين' : 
                          searchTerm ? `بحث: ${searchTerm}` : ''
                        }</span>
                        <button onClick={() => { setActiveFilterType('all'); setSearchTerm(''); }} className="hover:text-blue-800 dark:hover:text-blue-200">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="relative flex items-center">
                      <Search className="absolute right-2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="بحث..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-full pr-8 pl-8 py-1 text-xs w-32 focus:w-48 transition-all focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                    <button 
                      title="إضافة فرع"
                      onClick={() => {
                        setEditingBranch(null);
                        setModalBranchName('');
                        setModalBranchSupervisors([]);
                        setIsBranchModalOpen(true);
                        setSearchTerm('');
                      }}
                      className="p-2 hover:bg-blue-600/10 rounded-full text-blue-600 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredBranches.map((branch) => {
                  const assignments = dbAssignments.filter(a => a.branch_id === branch.id);
                  const assignedSups = assignments.map(a => dbSupervisors.find(s => s.id === a.supervisor_id));
                  const primarySupId = assignments.length > 0 ? assignments[0].supervisor_id : null;
                  const supColor = primarySupId ? supervisorColorMap[primarySupId] : null;
                  
                  return (
                    <motion.div 
                      key={branch.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border ${supColor ? supColor.border : 'border-slate-200 dark:border-slate-800'} rounded-sm p-4 ${supColor ? supColor.hover : 'hover:border-blue-500/50'} transition-all group shadow-lg relative overflow-hidden`}
                    >
                      {supColor && (
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${supColor.accent} opacity-50`} />
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <h4 className={`text-base font-bold ${supColor ? supColor.text : 'text-slate-800 dark:text-slate-100'} truncate flex-1`}>{branch.name}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                          <button 
                            onClick={() => {
                              setEditingBranch(branch);
                              setModalBranchName(branch.name);
                              setModalBranchOpeningDay(branch.opening_day || '');
                              setModalBranchOpeningMonth(branch.opening_month || '');
                              setModalBranchSupervisors(assignments.map(a => ({ id: a.supervisor_id, share: a.share })));
                              setIsBranchModalOpen(true);
                              setSearchTerm('');
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-slate-100 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={async () => {
                              if(confirm('حذف الفرع؟')) {
                                await supabase.from('commission_branches').delete().eq('id', branch.id);
                                fetchData();
                              }
                            }}
                            className="p-1.5 hover:bg-rose-500/10 rounded-sm text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        {assignedSups.length > 0 ? assignedSups.map((sup, idx) => {
                          const sColor = sup ? supervisorColorMap[sup.id] : null;
                          return (
                            <div key={idx} className={`flex justify-between text-[11px] ${sColor ? sColor.bg : 'bg-slate-800/30'} p-1.5 rounded-sm border ${sColor ? sColor.border : 'border-slate-700/30'} transition-colors`}>
                              <span className={`truncate max-w-[100px] font-bold ${sColor ? sColor.text : 'text-slate-400'}`}>{sup?.name || 'مجهول'}</span>
                              <span className={`${sColor ? sColor.text : 'text-blue-400'} font-bold english-nums`}>{formatNumber(assignments[idx].share * 100, 1)}%</span>
                            </div>
                          );
                        }) : (
                          <p className="text-slate-500 text-[10px] italic">لا يوجد مشرف</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'supervisors' && (
            <motion.div
              key="supervisors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-4 transition-colors duration-500">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-full shadow-sm w-fit">
                  <button onClick={() => navigateTo('dashboard')} title="العودة للوحة البيانات" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                    <ArrowRight size={18} />
                  </button>
                  <div className="p-2 bg-blue-600/10 rounded-full text-blue-600 dark:text-blue-400">
                    <Users size={20} />
                  </div>
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 ml-4">إدارة المشرفين</h2>
                  
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
                    <div className="relative flex items-center">
                      <Search className="absolute right-2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="بحث..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border-none rounded-full pr-8 pl-8 py-1 text-xs w-32 focus:w-48 transition-all focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                    <button 
                      title="طباعة تقرير"
                      onClick={handlePrintSupervisors}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                    >
                      <Printer size={18} />
                    </button>
                    <button 
                      title="إضافة مشرف"
                      onClick={() => {
                        setEditingSupervisor(null);
                        setModalSupervisorName('');
                        setIsSupervisorModalOpen(true);
                        setSearchTerm('');
                      }}
                      className="p-2 hover:bg-blue-600/10 rounded-full text-blue-600 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredSupervisors.map((calc) => {
                  const supColor = supervisorColorMap[calc.id];
                  return (
                    <motion.div 
                      key={calc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border ${supColor ? supColor.border : 'border-slate-200 dark:border-slate-800'} rounded-sm p-4 ${supColor ? supColor.hover : 'hover:border-blue-500/50'} transition-all group shadow-lg relative overflow-hidden`}
                    >
                      {supColor && (
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${supColor.accent} opacity-50`} />
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 ${supColor ? supColor.bg : 'bg-blue-600/5 dark:bg-blue-600/10'} rounded-md ${supColor ? supColor.text : 'text-blue-600 dark:text-blue-400'} border ${supColor ? supColor.border : 'border-blue-500/20'}`}>
                          <Users size={18} />
                        </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingSupervisor({ id: calc.id, name: calc.name });
                            setModalSupervisorName(calc.name);
                            setIsSupervisorModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-slate-100 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={async () => {
                            if(confirm('حذف المشرف؟')) {
                              await supabase.from('commission_supervisors').delete().eq('id', calc.id);
                              fetchData();
                            }
                          }}
                          className="p-1.5 hover:bg-rose-500/10 rounded-sm text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 flex-1 truncate">
                        <h4 className={`text-base font-bold ${supColor ? supColor.text : 'text-slate-100'} truncate`}>{calc.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded-sm ${supColor ? supColor.bg : 'bg-slate-800/50'} ${supColor ? supColor.text : 'text-slate-400'} text-[9px] font-bold border ${supColor ? supColor.border : 'border-slate-700/30'} flex items-center gap-1 shadow-sm`}>
                          <FileSpreadsheet size={10} />
                          {formatNumber(calc.branchesCount)}
                        </span>
                      </div>
                      <span className={`text-[10px] ${supColor ? supColor.bg : 'bg-blue-600/20'} ${supColor ? supColor.text : 'text-blue-400'} px-2 py-0.5 rounded-full border ${supColor ? supColor.border : 'border-blue-500/20'} font-bold english-nums`}>
                        {formatNumber(calc.share * 10, 1)}%
                      </span>
                    </div>
                    
                    <div className={`${supColor ? supColor.bg : 'bg-slate-50 dark:bg-blue-600/10'} p-2.5 rounded-md border ${supColor ? supColor.border : 'border-slate-200 dark:border-blue-500/30'} transition-colors`}>
                      <p className={`text-[9px] ${supColor ? supColor.text : 'text-slate-500 dark:text-blue-400'} uppercase tracking-wider mb-0.5`}>العمولة</p>
                      <p className={`text-lg font-mono font-bold ${supColor ? supColor.text : 'text-[#800000] dark:text-blue-400'} english-nums`}>{formatNumber(calc.supervisorCommission, 2)}</p>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <footer className="mt-12 text-center text-slate-400 dark:text-slate-600 text-sm">
        <p>© 2025 نظام إدارة مبيعات وعمولات الفروع • Commission</p>
      </footer>

      {/* Modals - Backgrounds and inputs */}
      <AnimatePresence>
        {isBranchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBranchModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-colors duration-500">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</h3>
                <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-1 uppercase tracking-wider">اسم الفرع</label>
                  <input value={modalBranchName} onChange={(e) => setModalBranchName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-1 uppercase tracking-wider">يوم الافتتاح (1-31)</label>
                    <input type="number" min="1" max="31" value={modalBranchOpeningDay} onChange={(e) => setModalBranchOpeningDay(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-1 uppercase tracking-wider">شهر الافتتاح</label>
                    <select value={modalBranchOpeningMonth} onChange={(e) => setModalBranchOpeningMonth(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
                      <option value="">اختر الشهر...</option>
                      {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map((m, i) => (
                        <option key={i+1} value={i+1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">المشرفين</label>
                    <button onClick={() => setModalBranchSupervisors([...modalBranchSupervisors, { id: '', share: 1 }])} className="text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1 hover:text-blue-500 transition-colors"><Plus size={14} /> إضافة</button>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                    {modalBranchSupervisors.map((s, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/30 p-2 rounded-md border border-slate-200 dark:border-slate-800/50">
                        <select value={s.id} onChange={(e) => {
                          const newSups = [...modalBranchSupervisors];
                          newSups[idx].id = e.target.value;
                          setModalBranchSupervisors(newSups);
                        }} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2 py-1.5 text-xs text-slate-800 dark:text-white outline-none">
                          <option value="">اختر مشرف...</option>
                          {dbSupervisors.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                        </select>
                        <div className="relative w-16">
                          <input type="number" step="0.1" value={s.share} onChange={(e) => {
                            const newSups = [...modalBranchSupervisors];
                            newSups[idx].share = parseFloat(e.target.value) || 0;
                            setModalBranchSupervisors(newSups);
                          }} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white font-mono outline-none pr-6" />
                        </div>
                        <button onClick={() => setModalBranchSupervisors(modalBranchSupervisors.filter((_, i) => i !== idx))} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                <button onClick={handleSaveBranch} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/20">حفظ</button>
                <button onClick={() => setIsBranchModalOpen(false)} className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supervisor Modal */}
      <AnimatePresence>
        {isSupervisorModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSupervisorModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transition-colors duration-500">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingSupervisor ? 'تعديل مشرف' : 'إضافة مشرف جديد'}</h3>
                <button onClick={() => setIsSupervisorModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-1 uppercase tracking-wider">اسم المشرف</label>
                  <input value={modalSupervisorName} onChange={(e) => setModalSupervisorName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                <button onClick={handleSaveSupervisor} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/40">حفظ</button>
                <button onClick={() => setIsSupervisorModalOpen(false)} className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Edit Modal */}
      <AnimatePresence>
        {isResultEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResultEditModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 transition-colors duration-500">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">تعديل المبيعات</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-bold">{editingResult?.branchName}</p>
                </div>
                <button onClick={() => setIsResultEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><X size={24} /></button>
              </div>
              
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">مبيعات {yearPrev}</label>
                    <input 
                      type="number" 
                      value={editSales2024} 
                      onChange={(e) => setEditSales2024(Number(e.target.value))} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono english-nums transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">مبيعات {yearCurr}</label>
                    <input 
                      type="number" 
                      value={editSales2025} 
                      onChange={(e) => setEditSales2025(Number(e.target.value))} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono english-nums transition-colors" 
                    />
                  </div>

                  {editingResult?.isSplit && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-3xl"
                    >
                      <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 mb-3 uppercase tracking-widest">مبيعات الـ {editingResult.openingDay} يوماً الأولى (افتتاح جزئي)</label>
                      <input 
                        type="number" 
                        value={editSplitSalesP1} 
                        onChange={(e) => setEditSplitSalesP1(Number(e.target.value))} 
                        placeholder="أدخل المبلغ هنا..."
                        className="w-full bg-white dark:bg-slate-900 border border-orange-500/30 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none text-lg font-mono english-nums transition-colors shadow-inner" 
                      />
                      <p className="mt-3 text-[11px] text-orange-600/70 leading-relaxed font-medium">
                        * سيقوم النظام باحتساب عمولة "فرع جديد" لهذا المبلغ، واعتبار المتبقي ({formatNumber(editSales2025 - editSplitSalesP1)}) كمبيعات خاضعة للمقارنة بنمو السنة السابقة.
                      </p>
                    </motion.div>
                  )}
                </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={handleUpdateSales}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/40 disabled:opacity-50"
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button 
                  onClick={() => setIsResultEditModalOpen(false)}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold rounded-2xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(2, 6, 23, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(51, 65, 85, 0.8);
        }
        * {
          font-variant-numeric: tabular-nums;
        }
        .english-nums {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          direction: ltr;
          display: inline-block;
        }
      `}</style>
        </div>
      </div>
    </div>
  );
}
