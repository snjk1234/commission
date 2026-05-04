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
  History
} from 'lucide-react';
import { SUPERVISORS_DATA, calculateCommissionRate, SupervisorGroup } from '@/lib/commission-utils';
import { createClient } from '@/utils/supabase/client';

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
}

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [data2024, setData2024] = useState<ExcelRow[]>([]);
  const [data2025, setData2025] = useState<ExcelRow[]>([]);
  const [calculatedData, setCalculatedData] = useState<CalculatedData[]>([]);
  
  // Database State
  const [dbBranches, setDbBranches] = useState<{id: string, name: string}[]>([]);
  const [dbSupervisors, setDbSupervisors] = useState<{id: string, name: string}[]>([]);
  const [dbAssignments, setDbAssignments] = useState<{branch_id: string, supervisor_id: string, share: number}[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [fileName, setFileName] = useState('');

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<{id: string, name: string} | null>(null);
  const [modalBranchName, setModalBranchName] = useState('');
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

  // Dynamic Years State
  const [yearPrev, setYearPrev] = useState(2024);
  const [yearCurr, setYearCurr] = useState(2025);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Clear search on tab change
  useEffect(() => {
    setSearchTerm('');
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
      await supabase.from('commission_data')
        .upsert({ branch_name: editingResult.branchName, year: yearPrev, sales: editSales2024 }, { onConflict: 'branch_name,year' });
      await supabase.from('commission_data')
        .upsert({ branch_name: editingResult.branchName, year: yearCurr, sales: editSales2025 }, { onConflict: 'branch_name,year' });
      await fetchData();
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
        'عمولة المشرف (10%)': row.supervisorCommission10
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

      const archiveItems = filteredResults.map(row => ({
        archive_id: archive.id,
        branch_name: row.branchName,
        sales_2024: row.sales2024,
        sales_2025: row.sales2025,
        growth: row.growth,
        rate: row.rate,
        commission: row.commission,
        supervisor_names: row.supervisorNames,
        supervisor_commission: row.supervisorCommission10
      }));

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

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
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
        
        // Calculate logic
        performCalculations(cleanPrev, cleanCurr);
        
        setIsLoading(false);
        setActiveTab('data');
        setSearchTerm('');
      } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء قراءة الملف');
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const performCalculations = (c2024: any[], c2025: any[]) => {
    const data24Map = new Map(c2024.map(item => [item.normalizedName, item.sales]));
    
    const results: CalculatedData[] = c2025.map((item25, index) => {
      const sales25 = item25.sales;
      const sales24 = data24Map.get(item25.normalizedName);
      
      // A branch is considered new if it didn't exist in 2024 OR if its sales were 0
      const isNew = sales24 === undefined || sales24 === 0;
      
      let difference = 0;
      let growth = 0;
      let rate = 0;

      if (isNew) {
        difference = sales25;
        growth = 100; // Arbitrary for new branches
        rate = calculateCommissionRate(0, true, item25.branchName);
      } else {
        difference = sales25 - sales24!;
        growth = sales24 !== 0 ? ((sales25 / sales24!) - 1) * 100 : 0;
        growth = parseFloat(growth.toFixed(2));
        rate = calculateCommissionRate(growth, false, item25.branchName);
      }

      const commission = sales25 * rate;

      return {
        id: index + 1,
        branchName: item25.branchName,
        sales2024: sales24 || 0,
        sales2025: sales25,
        difference,
        growth,
        rate,
        commission,
        isNew
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
          normalized_name: normalizeArabic(modalBranchName) 
        }).eq('id', branchId);
      } else {
        const { data, error } = await supabase.from('commission_branches').insert({ 
          name: modalBranchName, 
          normalized_name: normalizeArabic(modalBranchName) 
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
        assignments
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
          const calcRow = calculatedData.find(r => normalizeArabic(r.branchName) === normalizeArabic(branchObj.name));
          if (calcRow) {
            totalGroupCommission += calcRow.commission;
            supervisorCommission += calcRow.commission * 0.10 * assign.share;
            branchesCount++;
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

    return sorted.filter(row => 
      row.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.supervisorNames.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [enrichedResults, searchTerm, sortConfig]);

  const filteredBranches = useMemo(() => {
    return dbBranches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [dbBranches, searchTerm]);

  const filteredSupervisors = useMemo(() => {
    return supervisorCalculations.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [supervisorCalculations, searchTerm]);

  return (
    <div className="min-h-screen max-w-[1800px] mx-auto px-4 pb-12 transition-all duration-500" dir="rtl">
      {/* Global Top Header */}
      <header className="py-10 flex justify-between items-center border-b border-slate-800/50 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-right"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1 uppercase tracking-tight">
            إدارة العمولات
          </h1>
          <p className="text-slate-500 text-sm font-medium">نظام تحليل المبيعات واحتساب عمولات الفروع والمشرفين بدقة متناهية</p>
        </motion.div>
        
        {/* Placeholder for additional header info if needed */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <Calculator size={20} />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar (Right - Flexible) */}
        <aside className="w-full lg:w-20 hover:lg:w-72 flex-shrink-0 transition-all duration-500 group/sidebar z-50 order-1">
          <div className="sticky top-6 flex flex-col gap-4 overflow-hidden">
            {/* Sidebar content starting with search */}

          {/* Search Box */}
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-2 rounded-3xl shadow-xl relative group overflow-hidden">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/40 border border-transparent rounded-2xl pr-12 pl-10 py-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/30 transition-all placeholder:text-slate-600 lg:opacity-0 group-hover/sidebar:opacity-100"
            />
          </div>

          {/* Navigation Tabs */}
          <nav className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-2 rounded-3xl shadow-xl flex flex-col gap-1">
            {[
              { id: 'upload', label: 'رفع الملف', icon: Upload },
              { id: 'data', label: 'البيانات', icon: FileSpreadsheet },
              { id: 'results', label: 'النتائج', icon: Calculator },
              { id: 'archive', label: 'الأرشيف', icon: Archive },
              { id: 'branches', label: 'الفروع', icon: FileSpreadsheet },
              { id: 'supervisors', label: 'المشرفين', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex-shrink-0">
                  <tab.icon size={22} className={activeTab === tab.id ? 'text-white' : 'text-slate-500'} />
                </div>
                <span className="font-bold text-sm lg:opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300">
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
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-12 text-center shadow-2xl"
            >
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-400 border border-blue-500/20">
                  <Upload size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-slate-100">ارفع ملف الإكسل</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  تأكد من أن الملف يحتوي على ورقتين بأسماء سنوات متتالية (مثلاً <span className="text-blue-400 font-bold">2024</span> و <span className="text-blue-400 font-bold">2025</span>). 
                  يجب أن يكون اسم الفرع في العمود الثاني والمبيعات في العمود الثالث.
                </p>
                
                <label className="relative group cursor-pointer block">
                  <div className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/30">
                    {isLoading ? 'جاري المعالجة...' : 'اختيار ملف الإكسل'}
                    <Plus size={24} />
                  </div>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
                
                {fileName && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-green-400">
                    <CheckCircle2 size={18} />
                    <span>تم اختيار: {fileName}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 h-fit shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                    <FileSpreadsheet size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">بيانات {yearPrev}</h3>
                </div>
                <div className="overflow-auto max-h-[500px] custom-scrollbar rounded-xl border border-slate-800/50">
                  <div className="grid grid-cols-[50px_1fr_100px] gap-0 text-slate-500 text-xs border-b border-slate-800 bg-slate-950/40 font-bold sticky top-0 z-10">
                    <div className="p-3 text-center border-l border-slate-800">م</div>
                    <div className="p-3 text-right border-l border-slate-800">الفرع</div>
                    <div className="p-3 text-right">المبيعات</div>
                  </div>
                  <div className="divide-y divide-slate-800/50 bg-slate-900/20">
                    {data2024.filter(r => r.branchName.toLowerCase().includes(searchTerm.toLowerCase())).map((row, i) => (
                      <div key={i} className="grid grid-cols-[50px_1fr_100px] gap-0 items-center text-xs text-slate-300 hover:bg-slate-800/40 transition-colors">
                        <div className="p-3 text-center border-l border-slate-800/50 bg-slate-950/10 font-mono english-nums text-slate-500">{i + 1}</div>
                        <div className="p-3 text-right border-l border-slate-800/50 truncate">{row.branchName}</div>
                        <div className="p-3 text-right font-mono english-nums text-slate-400">{formatNumber(row.sales)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 h-fit shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400 border border-blue-500/20">
                    <FileSpreadsheet size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">بيانات {yearCurr}</h3>
                </div>
                <div className="overflow-auto max-h-[500px] custom-scrollbar rounded-xl border border-slate-800/50">
                  <div className="grid grid-cols-[50px_1fr_100px] gap-0 text-slate-500 text-xs border-b border-slate-800 bg-slate-950/40 font-bold sticky top-0 z-10">
                    <div className="p-3 text-center border-l border-slate-800">م</div>
                    <div className="p-3 text-right border-l border-slate-800">الفرع</div>
                    <div className="p-3 text-right">المبيعات</div>
                  </div>
                  <div className="divide-y divide-slate-800/50 bg-slate-900/20">
                    {filteredData2025.map((row, i) => (
                      <div key={i} className="grid grid-cols-[50px_1fr_100px] gap-0 items-center text-xs text-slate-300 hover:bg-slate-800/40 transition-colors">
                        <div className="p-3 text-center border-l border-slate-800/50 bg-slate-950/10 font-mono english-nums text-slate-500">{i + 1}</div>
                        <div className="p-3 text-right border-l border-slate-800/50 truncate">{row.branchName}</div>
                        <div className="p-3 text-right font-mono english-nums text-slate-400">{formatNumber(row.sales)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-100">تقرير العمولات المحتسبة</h3>
                <button 
                  onClick={handleExportAndArchive}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 font-bold"
                >
                  <Download size={18} />
                  تصدير النتائج والأرشفة
                </button>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[1200px]">
                  <div className="grid grid-cols-[50px_1.2fr_100px_100px_100px_85px_85px_110px_1.2fr_120px] gap-0 text-[13px] text-slate-500 border-b border-slate-800 font-bold uppercase tracking-wider bg-slate-950/20">
                    <div className="p-3 text-center border-l border-slate-800">م</div>
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
                        className="p-3 text-right border-l border-slate-800 flex items-center justify-between hover:bg-slate-800/40 transition-colors group"
                      >
                        {col.label}
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp size={12} className={sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-400' : ''} />
                          <ChevronDown size={12} className={sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-400' : ''} />
                        </div>
                      </button>
                    ))}
                    <div className="p-3 text-right">عمولة المشرف</div>
                  </div>
                  
                  <div className="divide-y divide-slate-800/30">
                    {filteredResults.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[50px_1.2fr_100px_100px_100px_85px_85px_110px_1.2fr_120px] gap-0 items-center text-[13px] text-slate-300 hover:bg-slate-800/40 transition-all group border-b border-slate-800/20">
                        <div className="p-3 text-center border-l border-slate-800/50 bg-slate-950/10 font-mono english-nums text-slate-500">{idx + 1}</div>
                        <div className="p-3 text-right border-l border-slate-800/50 font-bold text-slate-100 truncate flex items-center gap-2">
                          <span className="truncate">{row.branchName}</span>
                          {row.isNew && (
                            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[9px] rounded-full border border-green-500/20 font-bold whitespace-nowrap">جديد</span>
                          )}
                        </div>
                        <div className="p-3 text-right border-l border-slate-800/50 font-mono english-nums text-slate-400">{formatNumber(row.sales2024)}</div>
                        <div className="p-3 text-right border-l border-slate-800/50 font-mono english-nums text-slate-300">{formatNumber(row.sales2025)}</div>
                        <div className={`p-3 text-right border-l border-slate-800/50 font-mono english-nums font-bold ${row.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatNumber(row.difference)}
                        </div>
                        <div className="p-3 text-right border-l border-slate-800/50 font-mono text-blue-400 english-nums font-semibold">{formatNumber(row.growth, 2)}%</div>
                        <div className="p-3 text-right border-l border-slate-800/50 font-bold text-amber-400 english-nums">{formatNumber(row.rate * 100, 1)}%</div>
                        <div className="p-3 text-right border-l border-slate-800/50 font-bold text-slate-100 english-nums">{formatNumber(row.commission, 2)}</div>
                        <div className="p-3 text-right border-l border-slate-800/50 text-blue-400 font-bold truncate flex items-center justify-between group/edit">
                          <span className="truncate">{row.supervisorNames}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResult(row);
                              setEditSales2024(row.sales2024);
                              setEditSales2025(row.sales2025);
                              setIsResultEditModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-600/20 rounded-lg text-blue-400 opacity-0 group-hover/edit:opacity-100 transition-all ml-1"
                            title="تعديل المبيعات"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                        <div className="p-3 text-right">
                          <div className="font-black text-white bg-blue-600/20 py-1.5 px-3 rounded-lg border border-blue-500/30 text-right english-nums shadow-[0_0_15px_rgba(37,99,235,0.1)] group-hover:scale-105 transition-transform text-xs">
                            {formatNumber(row.supervisorCommission10, 2)}
                          </div>
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
              {!selectedArchive ? (
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400 border border-blue-500/20">
                      <History size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100">سجل الأرشيف</h3>
                  </div>

                  <div className="grid gap-4">
                    {archives.length > 0 ? archives.map((arc) => (
                      <div 
                        key={arc.id}
                        className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all cursor-pointer group"
                        onClick={() => viewArchiveDetails(arc.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                            <FileSpreadsheet size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200">{arc.filename}</h4>
                            <p className="text-xs text-slate-500">{new Date(arc.created_at).toLocaleString('ar-EG')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">إجمالي العمولات</p>
                            <p className="font-mono font-bold text-emerald-400 english-nums">{formatNumber(arc.total_commission, 2)}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteArchive(arc.id);
                            }}
                            className="p-3 hover:bg-rose-500/10 rounded-2xl text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center text-slate-600">
                        <Archive size={48} className="mx-auto mb-4 opacity-20" />
                        <p>لا توجد ملفات مؤرشفة حالياً</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedArchive(null)}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                      >
                        <X size={20} />
                      </button>
                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{selectedArchive.filename}</h3>
                        <p className="text-xs text-slate-500">بتاريخ {new Date(selectedArchive.created_at).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="flex gap-8 text-right">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">إجمالي الفروع</p>
                        <p className="font-mono font-bold text-emerald-400 english-nums">{formatNumber(selectedArchive.total_commission, 2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">إجمالي المشرفين</p>
                        <p className="font-mono font-bold text-blue-400 english-nums">{formatNumber(selectedArchive.total_supervisors_commission, 2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <div className="min-w-[1200px]">
                        <div className="grid grid-cols-[50px_1.2fr_100px_100px_100px_85px_85px_110px_1.2fr_120px] gap-0 text-[11px] text-slate-500 border-b border-slate-800 font-bold uppercase tracking-wider bg-slate-950/20">
                          <div className="p-3 text-center border-l border-slate-800">م</div>
                          <div className="p-3 text-right border-l border-slate-800">الفرع</div>
                          <div className="p-3 text-right border-l border-slate-800">2024</div>
                          <div className="p-3 text-right border-l border-slate-800">2025</div>
                          <div className="p-3 text-right border-l border-slate-800">الفارق</div>
                          <div className="p-3 text-right border-l border-slate-800">النمو</div>
                          <div className="p-3 text-right border-l border-slate-800">العمولة %</div>
                          <div className="p-3 text-right border-l border-slate-800">القيمة</div>
                          <div className="p-3 text-right border-l border-slate-800">المشرف</div>
                          <div className="p-3 text-right">عمولة المشرف</div>
                        </div>
                        <div className="divide-y divide-slate-800/30">
                          {archiveDetails.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-[50px_1.2fr_100px_100px_100px_85px_85px_110px_1.2fr_120px] gap-0 items-center text-[11px] text-slate-300 hover:bg-slate-800/40 border-b border-slate-800/20">
                              <div className="p-3 text-center border-l border-slate-800/50 bg-slate-950/10 font-mono english-nums text-slate-500">{idx + 1}</div>
                              <div className="p-3 text-right border-l border-slate-800/50 font-bold text-slate-100 truncate">{item.branch_name}</div>
                              <div className="p-3 text-right border-l border-slate-800/50 font-mono english-nums">{formatNumber(item.sales_2024)}</div>
                              <div className="p-3 text-right border-l border-slate-800/50 font-mono english-nums">{formatNumber(item.sales_2025)}</div>
                              <div className="p-3 text-right border-l border-slate-800/50 font-mono english-nums">{formatNumber(item.sales_2025 - item.sales_2024)}</div>
                              <div className="p-3 text-right border-l border-slate-800/50 font-mono english-nums">{formatNumber(item.growth, 2)}%</div>
                              <div className="p-3 text-right border-l border-slate-800/50 font-bold text-amber-400 english-nums">{formatNumber(item.rate * 100, 1)}%</div>
                              <div className="p-3 text-right border-l border-slate-800/50 font-bold text-slate-100 english-nums">{formatNumber(item.commission, 2)}</div>
                              <div className="p-3 text-right border-l border-slate-800/50 text-blue-400 font-bold truncate">{item.supervisor_names}</div>
                              <div className="p-3 text-right font-bold text-white bg-blue-600/10">{formatNumber(item.supervisor_commission, 2)}</div>
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
              <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl">
                <div>
                  <h3 className="text-xl font-bold mb-0.5 text-slate-100">إدارة الفروع والربط</h3>
                  <p className="text-xs text-slate-400">إضافة الفروع وربطها بالمشرفين المخصصين</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setEditingBranch(null);
                      setModalBranchName('');
                      setModalBranchSupervisors([]);
                      setIsBranchModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 text-sm font-bold"
                  >
                    <Plus size={18} />
                    إضافة فرع جديد
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredBranches.map((branch) => {
                  const assignments = dbAssignments.filter(a => a.branch_id === branch.id);
                  const assignedSups = assignments.map(a => dbSupervisors.find(s => s.id === a.supervisor_id));
                  
                  return (
                    <motion.div 
                      key={branch.id}
                      className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all group shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-base font-bold text-slate-100 truncate flex-1">{branch.name}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                          <button 
                            onClick={() => {
                              setEditingBranch(branch);
                              setModalBranchName(branch.name);
                              setModalBranchSupervisors(assignments.map(a => ({ id: a.supervisor_id, share: a.share })));
                              setIsBranchModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
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
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        {assignedSups.length > 0 ? assignedSups.map((sup, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] bg-slate-800/30 p-1.5 rounded-lg border border-slate-700/30">
                            <span className="text-slate-400 truncate max-w-[100px]">{sup?.name || 'مجهول'}</span>
                            <span className="text-blue-400 font-bold english-nums">{formatNumber(assignments[idx].share * 100, 1)}%</span>
                          </div>
                        )) : (
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
              <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl">
                <div>
                  <h3 className="text-xl font-bold mb-0.5 text-slate-100">إدارة المشرفين</h3>
                  <p className="text-xs text-slate-400">إدارة قائمة المشرفين في النظام</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingSupervisor(null);
                    setModalSupervisorName('');
                    setIsSupervisorModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 text-sm font-bold"
                >
                  <Plus size={18} />
                  إضافة مشرف
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredSupervisors.map((calc) => (
                  <motion.div 
                    key={calc.id}
                    className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all group shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400 border border-blue-500/20">
                        <Users size={18} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingSupervisor({ id: calc.id, name: calc.name });
                            setModalSupervisorName(calc.name);
                            setIsSupervisorModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
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
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="text-base font-bold text-slate-100 truncate flex-1">{calc.name}</h4>
                      <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold english-nums">
                        {formatNumber(calc.share * 10, 1)}%
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] mb-3">{formatNumber(calc.branchesCount)} فروع مرتبطة</p>
                    
                    <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
                      <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-0.5">العمولة</p>
                      <p className="text-lg font-mono font-bold text-blue-400 english-nums">{formatNumber(calc.supervisorCommission, 2)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <footer className="mt-12 text-center text-slate-600 text-sm">
        <p>© 2025 نظام إدارة مبيعات وعمولات الفروع • Commission</p>
      </footer>

      {/* Branch Modal */}
      <AnimatePresence>
        {isBranchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBranchModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                <h3 className="text-xl font-bold text-white">{editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</h3>
                <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">اسم الفرع</label>
                  <input value={modalBranchName} onChange={(e) => setModalBranchName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">المشرفين</label>
                    <button onClick={() => setModalBranchSupervisors([...modalBranchSupervisors, { id: '', share: 1 }])} className="text-blue-400 text-[11px] font-bold flex items-center gap-1 hover:text-blue-300 transition-colors"><Plus size={14} /> إضافة</button>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                    {modalBranchSupervisors.map((s, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-800/30 p-2 rounded-xl border border-slate-800/50">
                        <select value={s.id} onChange={(e) => {
                          const newSups = [...modalBranchSupervisors];
                          newSups[idx].id = e.target.value;
                          setModalBranchSupervisors(newSups);
                        }} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
                          <option value="">اختر مشرف...</option>
                          {dbSupervisors.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                        </select>
                        <div className="relative w-16">
                          <input type="number" step="0.1" value={s.share} onChange={(e) => {
                            const newSups = [...modalBranchSupervisors];
                            newSups[idx].share = parseFloat(e.target.value) || 0;
                            setModalBranchSupervisors(newSups);
                          }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none pr-6" />
                        </div>
                        <button onClick={() => setModalBranchSupervisors(modalBranchSupervisors.filter((_, i) => i !== idx))} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 bg-slate-800/20 border-t border-slate-800 flex gap-3">
                <button onClick={handleSaveBranch} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/20">حفظ</button>
                <button onClick={() => setIsBranchModalOpen(false)} className="px-6 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-800 transition-all">إلغاء</button>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                <h3 className="text-xl font-bold text-white">{editingSupervisor ? 'تعديل مشرف' : 'إضافة مشرف جديد'}</h3>
                <button onClick={() => setIsSupervisorModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">اسم المشرف</label>
                  <input value={modalSupervisorName} onChange={(e) => setModalSupervisorName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="p-5 bg-slate-800/20 border-t border-slate-800 flex gap-3">
                <button onClick={handleSaveSupervisor} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/20">حفظ</button>
                <button onClick={() => setIsSupervisorModalOpen(false)} className="px-6 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-800 transition-all">إلغاء</button>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">تعديل المبيعات</h3>
                  <p className="text-blue-400 font-bold">{editingResult?.branchName}</p>
                </div>
                <button onClick={() => setIsResultEditModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"><X size={24} /></button>
              </div>
              
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">مبيعات {yearPrev}</label>
                    <input 
                      type="number" 
                      value={editSales2024} 
                      onChange={(e) => setEditSales2024(Number(e.target.value))} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono english-nums" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">مبيعات {yearCurr}</label>
                    <input 
                      type="number" 
                      value={editSales2025} 
                      onChange={(e) => setEditSales2025(Number(e.target.value))} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono english-nums" 
                    />
                  </div>
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
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
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
