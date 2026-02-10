// 测试学年边界逻辑（不依赖数据库）
// 这个测试验证 getCurrentAcademicYearSemesters 函数的逻辑是否正确

/**
 * 获取当前学年的学期列表
 * 学年包括秋季学期（第一学期）和第二年春季学期（第二学期）
 * 例如：2024-2025学年 = 2024年秋季 + 2025年春季
 * @returns {Array<String>} 学年包含的两个学期
 */
function getCurrentAcademicYearSemesters() {
  const currentMonth = new Date().getMonth() + 1 // 1-12
  const currentYear = new Date().getFullYear()

  if (currentMonth >= 2 && currentMonth <= 7) {
    // 当前是春季学期（2-7月），学年是 去年秋季 + 今年春季
    return [
      `${currentYear - 1}年秋季`,
      `${currentYear}年春季`
    ]
  } else {
    // 当前是秋季学期（8-1月），学年是 今年秋季 + 明年春季
    return [
      `${currentYear}年秋季`,
      `${currentYear + 1}年春季`
    ]
  }
}

// 测试用例
function testAcademicYearLogic() {
  console.log('========================================');
  console.log('学年边界逻辑单元测试');
  console.log('========================================\n');

  // 测试用例1：春季学期（2-7月）
  console.log('测试用例1：春季学期（假设当前是2025年4月）');
  console.log('预期：2024年秋季 + 2025年春季');

  // 模拟2025年4月
  const originalDate = new Date();
  const mockDate1 = new Date(2025, 3, 15); // 2025年4月15日

  // 临时覆盖 Date
  const OriginalDate = global.Date;
  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(mockDate1);
      } else {
        super(...args);
      }
    }
    static now() {
      return mockDate1.getTime();
    }
  };

  const result1 = getCurrentAcademicYearSemesters();
  console.log('实际结果:', result1);

  if (result1[0] === '2024年秋季' && result1[1] === '2025年春季') {
    console.log('✅ 测试通过\n');
  } else {
    console.error('❌ 测试失败\n');
  }

  // 测试用例2：秋季学期（8-1月）
  console.log('测试用例2：秋季学期（假设当前是2025年9月）');
  console.log('预期：2025年秋季 + 2026年春季');

  // 模拟2025年9月
  const mockDate2 = new Date(2025, 8, 15); // 2025年9月15日

  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(mockDate2);
      } else {
        super(...args);
      }
    }
    static now() {
      return mockDate2.getTime();
    }
  };

  const result2 = getCurrentAcademicYearSemesters();
  console.log('实际结果:', result2);

  if (result2[0] === '2025年秋季' && result2[1] === '2026年春季') {
    console.log('✅ 测试通过\n');
  } else {
    console.error('❌ 测试失败\n');
  }

  // 测试用例3：一月份（属于秋季学期）
  console.log('测试用例3：一月份（假设当前是2026年1月）');
  console.log('预期：2025年秋季 + 2026年春季');

  // 模拟2026年1月
  const mockDate3 = new Date(2026, 0, 15); // 2026年1月15日

  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(mockDate3);
      } else {
        super(...args);
      }
    }
    static now() {
      return mockDate3.getTime();
    }
  };

  const result3 = getCurrentAcademicYearSemesters();
  console.log('实际结果:', result3);

  if (result3[0] === '2025年秋季' && result3[1] === '2026年春季') {
    console.log('✅ 测试通过\n');
  } else {
    console.error('❌ 测试失败\n');
  }

  // 测试用例4：二月份（属于春季学期）
  console.log('测试用例4：二月份（假设当前是2026年2月）');
  console.log('预期：2025年秋季 + 2026年春季');

  // 模拟2026年2月
  const mockDate4 = new Date(2026, 1, 15); // 2026年2月15日

  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(mockDate4);
      } else {
        super(...args);
      }
    }
    static now() {
      return mockDate4.getTime();
    }
  };

  const result4 = getCurrentAcademicYearSemesters();
  console.log('实际结果:', result4);

  if (result4[0] === '2025年秋季' && result4[1] === '2026年春季') {
    console.log('✅ 测试通过\n');
  } else {
    console.error('❌ 测试失败\n');
  }

  // 测试用例5：七月份（属于春季学期）
  console.log('测试用例5：七月份（假设当前是2025年7月）');
  console.log('预期：2024年秋季 + 2025年春季');

  // 模拟2025年7月
  const mockDate5 = new Date(2025, 6, 15); // 2025年7月15日

  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(mockDate5);
      } else {
        super(...args);
      }
    }
    static now() {
      return mockDate5.getTime();
    }
  };

  const result5 = getCurrentAcademicYearSemesters();
  console.log('实际结果:', result5);

  if (result5[0] === '2024年秋季' && result5[1] === '2025年春季') {
    console.log('✅ 测试通过\n');
  } else {
    console.error('❌ 测试失败\n');
  }

  // 测试用例6：八月份（属于秋季学期）
  console.log('测试用例6：八月份（假设当前是2025年8月）');
  console.log('预期：2025年秋季 + 2026年春季');

  // 模拟2025年8月
  const mockDate6 = new Date(2025, 7, 15); // 2025年8月15日

  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(mockDate6);
      } else {
        super(...args);
      }
    }
    static now() {
      return mockDate6.getTime();
    }
  };

  const result6 = getCurrentAcademicYearSemesters();
  console.log('实际结果:', result6);

  if (result6[0] === '2025年秋季' && result6[1] === '2026年春季') {
    console.log('✅ 测试通过\n');
  } else {
    console.error('❌ 测试失败\n');
  }

  // 恢复原始 Date
  global.Date = OriginalDate;

  console.log('========================================');
  console.log('学年边界逻辑测试完成');
  console.log('========================================');
}

// 运行测试
testAcademicYearLogic();

// 输出学年边界说明
console.log('\n========================================');
console.log('学年边界说明');
console.log('========================================');
console.log('春季学期：2月-7月');
console.log('  - 学年 = 去年秋季 + 今年春季');
console.log('  - 例如：2025年4月 → 2024-2025学年（2024年秋季 + 2025年春季）');
console.log('');
console.log('秋季学期：8月-次年1月');
console.log('  - 学年 = 今年秋季 + 明年春季');
console.log('  - 例如：2025年9月 → 2025-2026学年（2025年秋季 + 2026年春季）');
console.log('');
console.log('关键月份边界：');
console.log('  - 1月：属于秋季学期（例如：2026年1月 → 2025-2026学年）');
console.log('  - 2月：属于春季学期（例如：2026年2月 → 2025-2026学年）');
console.log('  - 7月：属于春季学期（例如：2025年7月 → 2024-2025学年）');
console.log('  - 8月：属于秋季学期（例如：2025年8月 → 2025-2026学年）');
