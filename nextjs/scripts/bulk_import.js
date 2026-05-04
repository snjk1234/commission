const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim().replace(/"/g, '');
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

const SUPERVISORS_DATA = [
  {
    supervisors: [{ name: 'أحمد حمدي', share: 1 }],
    branches: [
      'ف سكتشر ينبع', 'ف ينبع', 'ف الدائري MED', 'ف سكتشر الدائري', 'ف امام بخاري',
      'ف اسكتشر بخاري', 'ف سلطانة ر', 'ف بيت الدقل', 'ف ينبع 2', 'ف العلا',
      'ف مهد الدهب', 'ف الحناكية', 'ف النور مول'
    ]
  },
  {
    supervisors: [{ name: 'سلامة محسن', share: 1 }],
    branches: [
      'ف عنيزة', 'ف اسكتشرعنيزة', 'ف بريدة', 'ف سكتشر بريدة', 'ف الرس',
      'ف اسكتشر الرس', 'ف المجمعة', 'ف سكتشر المجمعة', 'ف حفر الباطن',
      'ف الزلفي', 'ف بريدة 2', 'ف الخفجي', 'ف البدائع'
    ]
  },
  {
    supervisors: [{ name: 'أحمد حسن عوض', share: 1 }],
    branches: [
      'ف حائل', 'ف اسكتشرعنيزة', 'ف الجوف', 'ف اسكتشر سكاكا', 'ف السنابل',
      'ف اسكتشر الرس', 'ف موسى', 'ف المروج2', 'ف سكتشر المروج', 'ف عــرعــر',
      'ف اسكتشر سلمان', 'ف السلمان', 'ف طـــريــف', 'ف سكتشر عـرعـر',
      'ف رفحاء', 'ف حــائـل 2', 'ف طبرجل'
    ]
  },
  {
    supervisors: [{ name: 'سفيان طحان', share: 1 }],
    branches: [
      'ف الصفا', 'ف اسكتشرعنيزة', 'ف الحمدانية', 'العوالي مكة', 'ف الرصيفة',
      'ف اسكتشر الرس', 'ف  سكتشر عوالي', 'ف حـــراء', 'ف الشرائع', 'ف العزيزية',
      'ف الملكه', 'ف صاري', 'ف سكتشر العزيزية', 'ف سكتشر الشرفية', 'ف الشوقية مكة',
      'ف الأمير فواز', 'ف النوارية', 'ف رابــــغ', 'ف بطحاء قريش', 'ف طيبة جـدة',
      'ف الورود', 'ف الجموم', 'ف الفروسية جدة'
    ]
  },
  {
    supervisors: [
      { name: 'محمود هدايه', share: 0.75 },
      { name: 'محمود عبد الغفور', share: 0.25 }
    ],
    branches: [
      'ف اسكتشر الروضة', 'ف اسكتشرعنيزة', 'ف الجبيل', 'العوالي مكة', 'ف الخرج',
      'ف اسكتشر الرس', 'ف النسيم', 'ف سكتشر حياة بلازا', 'ف الحياة بلازا',
      'ف الدمام2', 'ف سكتشر سلمان رياض', 'ف السلمان رياض', 'ف الثميري 1',
      'ف البديعة', 'ف الخزان', 'ف الخبر', 'ف العليا', 'ف الاحساء مبرز',
      'ف حي الروابي', 'ف الاحساء2', 'ف الشفاء رياض', 'ف الدمام 3',
      'ف الدائري رياض', 'ف القطيف', 'ف النظيم', 'ف راس تنورة', 'ف طويق', 'ف الحمراء مول'
    ]
  },
  {
    supervisors: [{ name: 'رائد حمدي', share: 1 }],
    branches: ['ف فيلانتو سكاكا']
  },
  {
    supervisors: [{ name: 'طارق ابراهيم', share: 1 }],
    branches: ['ف الباحة', 'ف اسكتشرعنيزة', 'ف الحوية', 'العوالي مكة', 'ف القمرية', 'ف اسكتشر الرس', 'ف الليث']
  },
  {
    supervisors: [{ name: 'عبد المولى', share: 1 }],
    branches: ['ف فيلانتو حفر']
  },
  {
    supervisors: [
      { name: 'ضياء صالح', share: 0.75 },
      { name: 'عمرو اسماعيل', share: 0.25 }
    ],
    branches: [
      'ف سكتشر خميس3', 'ف اسكتشرعنيزة', 'اسكتشر محايل عسير', 'العوالي مكة',
      'ف نجران2', 'ف اسكتشر الرس', 'ف خميس 2', 'ف جيزان 2', 'ف أبو عريش',
      'ف البيشة', 'ف خميس', 'ف الحــزام', 'ف محايل عسير', 'ف اسكتشر صبيا',
      'ف صبيا', 'ف صامطه', 'ف خميس 4', 'ف نجران 3', 'ف الــدرب', 'ف شـرورة',
      'ف جيزان 3', 'ف موجان بارك', 'ف الظهران', 'ف المنسك'
    ]
  },
  {
    supervisors: [{ name: 'ياسر هداية الله', share: 1 }],
    branches: ['جدة بارك', 'ف اسكتشرعنيزة', 'ف الياسمين مول', 'العوالي مكة', 'ف العرب مول']
  }
];

async function run() {
  console.log("Starting bulk import (with manual link check)...");
  for (const group of SUPERVISORS_DATA) {
    const supervisorIds = [];
    for (const sup of group.supervisors) {
      const { data: existingSup } = await supabase.from('commission_supervisors').select('id').eq('name', sup.name).maybeSingle();
      if (existingSup) {
        supervisorIds.push({ id: existingSup.id, share: sup.share });
      } else {
        const { data: newSup, error } = await supabase.from('commission_supervisors').insert({ name: sup.name }).select().single();
        if (!error) supervisorIds.push({ id: newSup.id, share: sup.share });
      }
    }

    for (const branchName of group.branches) {
      const { data: existingBranch } = await supabase.from('commission_branches').select('id').eq('name', branchName).maybeSingle();
      let branchId = existingBranch?.id;

      if (!branchId) {
        const { data: newBranch, error } = await supabase.from('commission_branches').insert({ 
          name: branchName, 
          normalized_name: normalizeArabic(branchName) 
        }).select().single();
        if (!error) branchId = newBranch.id;
      }

      if (branchId) {
        for (const supInfo of supervisorIds) {
          // Manual check for existence before insert
          const { data: existingAssignment } = await supabase.from('commission_branch_assignments')
            .select('id')
            .eq('branch_id', branchId)
            .eq('supervisor_id', supInfo.id)
            .maybeSingle();

          if (!existingAssignment) {
            console.log(`Linking ${branchName} to ${supInfo.id}`);
            await supabase.from('commission_branch_assignments').insert({
              branch_id: branchId,
              supervisor_id: supInfo.id,
              share: supInfo.share
            });
          }
        }
      }
    }
  }
  console.log("Bulk import finished successfully!");
}

run();
