// University data with tier classification and key CDS statistics
// Tier 1: Ivy League | Tier 2: Top Non-Ivy | Tier 3: Excellent Universities

export const tiers = [
  { id: 1, labelKey: 'universities.tier1', label: 'Ivy League' },
  { id: 2, labelKey: 'universities.tier2', label: '顶尖非藤校' },
  { id: 3, labelKey: 'universities.tier3', label: '优秀大学' }
]

export const schools = [
  // Tier 1 - Ivy League
  { id: 'harvard', name: 'Harvard University', nameZh: '哈佛大学', tier: 1, cdsFile: 'Harvard_University_CDS_Data.md', logo: 'Harvard_University_logo.png', admissionRate: '3.5%', satRange: '1510-1580', intlPercent: '11.0%', keyValues: ['Respect', 'Integrity', 'Excellence', 'Leadership'] },
  { id: 'yale', name: 'Yale University', nameZh: '耶鲁大学', tier: 1, cdsFile: 'Yale_University_CDS_Data.md', logo: 'Yale_University_logo.png', admissionRate: '3.9%', satRange: '1480-1560', intlPercent: '11.1%', keyValues: ['Improving the World', 'Leadership', 'Free Exchange of Ideas'] },
  { id: 'princeton', name: 'Princeton University', nameZh: '普林斯顿大学', tier: 1, cdsFile: 'Princeton_University_CDS_Data.md', logo: 'Princeton_University_logo.png', admissionRate: '4.4%', satRange: '1490-1560', intlPercent: '13.0%', keyValues: ['Excellence', 'Service', 'Scholarship', 'Global Impact'] },
  { id: 'columbia', name: 'Columbia University', nameZh: '哥伦比亚大学', tier: 1, cdsFile: 'Columbia_University_CDS_Data.md', logo: 'Columbia_University_logo.png', admissionRate: '3.9%', satRange: '1510-1560', intlPercent: '20.5%', keyValues: ['Civic Engagement', 'Rigorous Debate', 'Diversity', 'Inclusion'] },
  { id: 'upenn', name: 'University of Pennsylvania', nameZh: '宾夕法尼亚大学', tier: 1, cdsFile: 'University_of_Pennsylvania_CDS_Data.md', logo: 'University_of_Pennsylvania_logo.png', admissionRate: '5.4%', satRange: '1510-1570', intlPercent: '13.3%', keyValues: ['Excellence', 'Freedom of Inquiry', 'Respect', 'Discovery'] },
  { id: 'brown', name: 'Brown University', nameZh: '布朗大学', tier: 1, cdsFile: 'Brown_University_CDS_Data.md', logo: 'Brown_University_logo.svg', admissionRate: '5.4%', satRange: '1510-1560', intlPercent: '13.5%', keyValues: ['Free Inquiry', 'Open Curriculum', 'Interdisciplinary', 'Community Service'] },
  { id: 'cornell', name: 'Cornell University', nameZh: '康奈尔大学', tier: 1, cdsFile: 'Cornell_University_CDS_Data.md', logo: 'Cornell_University_logo.png', admissionRate: '8.4%', satRange: '1510-1560', intlPercent: '9.5%', keyValues: ['Discovery', 'Global Citizenship', 'Broad Inquiry', 'Public Engagement'] },
  { id: 'dartmouth', name: 'Dartmouth College', nameZh: '达特茅斯学院', tier: 1, cdsFile: 'Dartmouth_College_CDS_Data.md', logo: 'Dartmouth_College_logo.svg', admissionRate: '5.4%', satRange: 'N/A', intlPercent: '14.9%', keyValues: ['Liberal Arts', 'Research', 'Community'] },

  // Tier 2 - Top Non-Ivy
  { id: 'mit', name: 'Massachusetts Institute of Technology', nameZh: '麻省理工学院', tier: 2, cdsFile: 'MIT_CDS_Data.md', logo: 'MIT_logo.png', admissionRate: '4.5%', satRange: '1520-1570', intlPercent: '11.7%', keyValues: ['Excellence', 'Curiosity', 'Openness', 'Innovation'] },
  { id: 'stanford', name: 'Stanford University', nameZh: '斯坦福大学', tier: 2, cdsFile: 'Stanford_University_CDS_Data.md', logo: 'Stanford_University_logo.png', admissionRate: '3.6%', satRange: '1510-1570', intlPercent: '12.2%', keyValues: ['Curiosity', 'Critical Thinking', 'Integrity', 'Social Impact'] },
  { id: 'caltech', name: 'California Institute of Technology', nameZh: '加州理工学院', tier: 2, cdsFile: 'Caltech_CDS_Data.md', logo: 'Caltech_logo.svg', admissionRate: '2.6%', satRange: 'N/A', intlPercent: '14.1%', keyValues: ['Honor', 'Integrity', 'Innovation', 'Collegiality'] },
  { id: 'duke', name: 'Duke University', nameZh: '杜克大学', tier: 2, cdsFile: 'Duke_University_CDS_Data.md', logo: 'Duke_University_logo.png', admissionRate: '5.7%', satRange: '1520-1570', intlPercent: '10.6%', keyValues: ['Engagement', 'Excellence', 'Inclusion', 'Discovery'] },
  { id: 'uchicago', name: 'University of Chicago', nameZh: '芝加哥大学', tier: 2, cdsFile: 'University_of_Chicago_CDS_Data.md', logo: 'University_of_Chicago_logo.svg', admissionRate: '4.5%', satRange: '1510-1560', intlPercent: '16.8%', keyValues: ['Free Expression', 'Diversity', 'Intellectual Rigor'] },
  { id: 'northwestern', name: 'Northwestern University', nameZh: '西北大学', tier: 2, cdsFile: 'Northwestern_University_CDS_Data.md', logo: 'Northwestern_University_logo.png', admissionRate: '7.7%', satRange: '1510-1560', intlPercent: '11.8%', keyValues: ['Interdisciplinary', 'Innovation', 'Excellence'] },
  { id: 'johns_hopkins', name: 'Johns Hopkins University', nameZh: '约翰斯·霍普金斯大学', tier: 2, cdsFile: 'Johns_Hopkins_University_CDS_Data.md', logo: 'Johns_Hopkins_University_logo.png', admissionRate: '6.4%', satRange: '1530-1560', intlPercent: '15.2%', keyValues: ['Research', 'Discovery', 'Innovation'] },
  { id: 'rice', name: 'Rice University', nameZh: '莱斯大学', tier: 2, cdsFile: 'Rice_University_CDS_Data.md', logo: 'Rice_University_logo.svg', admissionRate: '8.0%', satRange: '1510-1560', intlPercent: '12.8%', keyValues: ['Excellence', 'Research', 'Community'] },
  { id: 'vanderbilt', name: 'Vanderbilt University', nameZh: '范德堡大学', tier: 2, cdsFile: 'Vanderbilt_University_CDS_Data.md', logo: 'Vanderbilt_University_logo.svg', admissionRate: '5.4%', satRange: '1510-1560', intlPercent: '11.2%', keyValues: ['Discovery', 'Service', 'Community'] },
  { id: 'georgetown', name: 'Georgetown University', nameZh: '乔治城大学', tier: 2, cdsFile: 'Georgetown_University_CDS_Data.md', logo: 'Georgetown_University_logo.png', admissionRate: '12.9%', satRange: '1400-1540', intlPercent: '13.4%', keyValues: ['Service', 'Justice', 'Global Engagement'] },
  { id: 'notre_dame', name: 'University of Notre Dame', nameZh: '圣母大学', tier: 2, cdsFile: 'University_of_Notre_Dame_CDS_Data.md', logo: 'Notre_Dame_logo.png', admissionRate: '11.3%', satRange: '1470-1540', intlPercent: '7.5%', keyValues: ['Faith', 'Service', 'Community', 'Excellence'] },

  // Tier 3 - Excellent Universities
  { id: 'ucla', name: 'University of California, Los Angeles', nameZh: '加州大学洛杉矶分校', tier: 3, cdsFile: 'UCLA_CDS_Data.md', logo: 'UCLA_logo.png', admissionRate: '9.4%', satRange: 'N/A', intlPercent: '8.4%', keyValues: ['Diversity', 'Excellence', 'Public Service'] },
  { id: 'uc_berkeley', name: 'University of California, Berkeley', nameZh: '加州大学伯克利分校', tier: 3, cdsFile: 'UC_Berkeley_CDS_Data.md', logo: 'UC_Berkeley_logo.png', admissionRate: '11.0%', satRange: 'N/A', intlPercent: '9.8%', keyValues: ['Excellence', 'Access', 'Public Mission'] },
  { id: 'umich', name: 'University of Michigan', nameZh: '密歇根大学', tier: 3, cdsFile: 'University_of_Michigan_CDS_Data.md', logo: 'University_of_Michigan_logo.png', admissionRate: '15.6%', satRange: '1360-1530', intlPercent: '8.0%', keyValues: ['Excellence', 'Diversity', 'Public Service'] },
  { id: 'emory', name: 'Emory University', nameZh: '埃默里大学', tier: 3, cdsFile: 'Emory_University_CDS_Data.md', logo: 'Emory_University_logo.svg', admissionRate: '10.3%', satRange: '1480-1540', intlPercent: '16.7%', keyValues: ['Discovery', 'Service', 'Social Justice'] },
  { id: 'cmu', name: 'Carnegie Mellon University', nameZh: '卡内基梅隆大学', tier: 3, cdsFile: 'Carnegie_Mellon_University_CDS_Data.md', logo: 'Carnegie_Mellon_University_logo.svg', admissionRate: '11.7%', satRange: '1510-1560', intlPercent: '23.3%', keyValues: ['Innovation', 'Problem-Solving', 'Interdisciplinary'] },
  { id: 'nyu', name: 'New York University', nameZh: '纽约大学', tier: 3, cdsFile: 'NYU_CDS_Data.md', logo: 'NYU_logo.png', admissionRate: '9.2%', satRange: '1470-1540', intlPercent: '26.2%', keyValues: ['Global Engagement', 'Diversity', 'Innovation'] },
  { id: 'georgia_tech', name: 'Georgia Institute of Technology', nameZh: '佐治亚理工学院', tier: 3, cdsFile: 'Georgia_Tech_CDS_Data.md', logo: 'Georgia_Tech_logo.png', admissionRate: '11.1%', satRange: '1370-1530', intlPercent: '12.0%', keyValues: ['Innovation', 'Technology', 'Leadership'] },
  { id: 'uva', name: 'University of Virginia', nameZh: '弗吉尼亚大学', tier: 3, cdsFile: 'University_of_Virginia_CDS_Data.md', logo: 'University_of_Virginia_logo.png', admissionRate: '16.8%', satRange: '1410-1520', intlPercent: '4.8%', keyValues: ['Honor', 'Service', 'Excellence'] },
  { id: 'unc', name: 'University of North Carolina at Chapel Hill', nameZh: '北卡罗来纳大学教堂山分校', tier: 3, cdsFile: 'UNC_Chapel_Hill_CDS_Data.md', logo: 'UNC_Chapel_Hill_logo.svg', admissionRate: '15.3%', satRange: 'N/A', intlPercent: '5.5%', keyValues: ['Public Service', 'Research', 'Access'] },
  { id: 'uf', name: 'University of Florida', nameZh: '佛罗里达大学', tier: 3, cdsFile: 'University_of_Florida_CDS_Data.md', logo: 'University_of_Florida_logo.svg', admissionRate: '24.2%', satRange: '1330-1470', intlPercent: '2.6%', keyValues: ['Excellence', 'Diversity', 'Service'] },
  { id: 'ut_austin', name: 'University of Texas at Austin', nameZh: '德克萨斯大学奥斯汀分校', tier: 3, cdsFile: 'University_of_Texas_Austin_CDS_Data.md', logo: 'University_of_Texas_Austin_logo.png', admissionRate: '26.6%', satRange: 'N/A', intlPercent: '4.5%', keyValues: ['Leadership', 'Innovation', 'Opportunity'] },
  { id: 'usc', name: 'University of Southern California', nameZh: '南加州大学', tier: 3, cdsFile: 'University_of_Southern_California_CDS_Data.md', logo: 'University_of_Southern_California_logo.png', admissionRate: '9.8%', satRange: '1450-1530', intlPercent: '12.8%', keyValues: ['Innovation', 'Global Impact', 'Diversity'] },
  { id: 'washu', name: 'Washington University in St. Louis', nameZh: '圣路易斯华盛顿大学', tier: 3, cdsFile: 'Washington_University_St_Louis_CDS_Data.md', logo: 'Washington_University_St_Louis_logo.svg', admissionRate: '12.1%', satRange: '1500-1570', intlPercent: '9.9%', keyValues: ['Discovery', 'Innovation', 'Community'] },
  { id: 'uw', name: 'University of Washington', nameZh: '华盛顿大学', tier: 3, cdsFile: 'University_of_Washington_CDS_Data.md', logo: 'University_of_Washington_logo.svg', admissionRate: '39.1%', satRange: '1280-1490', intlPercent: '11.7%', keyValues: ['Excellence', 'Innovation', 'Public Impact'] },
  { id: 'boston_college', name: 'Boston College', nameZh: '波士顿学院', tier: 3, cdsFile: 'Boston_College_CDS_Data.md', logo: 'Boston_College_logo.png', admissionRate: '16.2%', satRange: 'N/A', intlPercent: '6.6%', keyValues: ['Service', 'Faith', 'Intellectual Life'] }
]

// Helper: get schools by tier
export function getSchoolsByTier(tierId) {
  return schools.filter(s => s.tier === tierId)
}

// Helper: find school by id
export function getSchoolById(id) {
  return schools.find(s => s.id === id)
}
