/**
 * Online course program data — extracted from Obsidian knowledge cards.
 * Each program has a corresponding markdown detail file in ./online-courses/.
 */

export const categories = [
  { id: 'ivy', labelKey: 'onlineCourses.catIvy' },
  { id: 'private', labelKey: 'onlineCourses.catPrivate' },
  { id: 'uc', labelKey: 'onlineCourses.catUC' }
]

export const programs = [
  {
    id: 'harvard',
    university: 'Harvard University',
    universityZh: '哈佛大学',
    programName: 'Harvard Summer School',
    programNameZh: '哈佛大学暑期学校',
    category: 'ivy',
    rankingUSNews: '#3',
    url: 'https://www.summer.harvard.edu/',
    logo: 'Harvard_logo.png',
    target: ['highSchool', 'undergraduate'],
    credit: true,
    online: true,
    costRange: '$4,180–$8,160',
    deadline: '4/1',
    deadlineType: 'fixed',
    status: '2026夏季注册已开放',
    mdFile: 'Harvard Summer School.md',
    highlights: ['300+课程', '哈佛正式成绩单', '线上+校园']
  },
  {
    id: 'cornell',
    university: 'Cornell University',
    universityZh: '康奈尔大学',
    programName: 'Cornell Pre-College Online',
    programNameZh: '康奈尔线上预科',
    category: 'ivy',
    rankingUSNews: '#12',
    url: 'https://sce.cornell.edu/precollege',
    logo: 'Cornell_logo.png',
    target: ['highSchool'],
    credit: true,
    online: true,
    costRange: '$5,820–$15,520',
    deadline: '4/28',
    deadlineType: 'fixed',
    status: '2026夏季申请已开放',
    mdFile: 'Cornell Pre-College Online.md',
    highlights: ['可转学分', '夏季+冬季', '国际学生友好']
  },
  {
    id: 'nyu',
    university: 'New York University',
    universityZh: '纽约大学',
    programName: 'NYU Pre-College Online',
    programNameZh: 'NYU预科项目（线上）',
    category: 'private',
    rankingUSNews: '#35',
    url: 'https://www.nyu.edu/precollege',
    logo: 'NYU_logo.png',
    target: ['highSchool'],
    credit: true,
    online: true,
    costRange: '$4,180–$8,160',
    deadline: '4/1',
    deadlineType: 'fixed',
    status: '2026夏季申请已开放',
    mdFile: 'NYU Pre-College Online.md',
    highlights: ['4大领域', 'STEM+艺术+商科', '线上/校园']
  },
  {
    id: 'georgetown',
    university: 'Georgetown University',
    universityZh: '乔治城大学',
    programName: 'Georgetown Summer High School Online',
    programNameZh: '乔治城暑期高中生项目（线上）',
    category: 'private',
    rankingUSNews: '#22',
    url: 'https://summer.georgetown.edu/',
    logo: 'Georgetown_logo.png',
    target: ['highSchool'],
    credit: true,
    online: true,
    costRange: '详见官网',
    deadline: '滚动',
    deadlineType: 'rolling',
    status: '申请已开放',
    mdFile: 'Georgetown Summer High School Online.md',
    highlights: ['全年在线', '4类项目', '时间最灵活']
  },
  {
    id: 'ucla',
    university: 'UCLA',
    universityZh: '加州大学洛杉矶分校',
    programName: 'UCLA Summer Sessions Online',
    programNameZh: 'UCLA暑期课程（线上）',
    category: 'uc',
    rankingUSNews: '#15',
    url: 'https://summer.ucla.edu/',
    logo: 'UCLA_logo.png',
    target: ['highSchool', 'undergraduate'],
    credit: true,
    online: true,
    costRange: '见费用计算器',
    deadline: '滚动',
    deadlineType: 'rolling',
    status: '2026夏季注册已开放',
    mdFile: 'UCLA Summer Sessions Online.md',
    highlights: ['800+课程', 'UCLA正式学分', '多会期选择']
  },
  {
    id: 'ucsd',
    university: 'UC San Diego',
    universityZh: '加州大学圣迭戈分校',
    programName: 'UCSD Summer Session Remote',
    programNameZh: 'UCSD暑期课程（远程）',
    category: 'uc',
    rankingUSNews: '#33',
    url: 'https://summersession.ucsd.edu/',
    logo: 'UCSD_logo.png',
    target: ['highSchool', 'undergraduate'],
    credit: true,
    online: true,
    costRange: '详见官网',
    deadline: '滚动',
    deadlineType: 'rolling',
    status: '2026暑期已开放',
    mdFile: 'UCSD Summer Session Remote.md',
    highlights: ['门槛最低', 'Anyone can take', '面授+远程']
  }
]

export function getProgramById(id) {
  return programs.find(p => p.id === id)
}

export function getProgramsByCategory(categoryId) {
  return programs.filter(p => p.category === categoryId)
}
