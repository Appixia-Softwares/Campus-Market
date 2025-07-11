// Complete list of universities and adult education institutions in Zimbabwe
interface University {
    id: string;
    name: string;
    location: string;
    type?: string;
  }
  
  const ZIM_UNIVERSITIES: University[] = [
    // Universities
    { id: 'uz', name: 'University of Zimbabwe', location: 'Harare', type: 'university' },
    { id: 'nust', name: 'National University of Science and Technology', location: 'Bulawayo', type: 'university' },
    { id: 'msu', name: 'Midlands State University', location: 'Gweru', type: 'university' },
    { id: 'cuz', name: 'Catholic University of Zimbabwe', location: 'Harare', type: 'university' },
    { id: 'gzu', name: 'Great Zimbabwe University', location: 'Masvingo', type: 'university' },
    { id: 'zsm', name: 'Zimbabwe School of Mines', location: 'Bulawayo', type: 'university' },
    { id: 'hit', name: 'Harare Institute of Technology', location: 'Harare', type: 'university' },
    { id: 'bindura', name: 'Bindura University of Science Education', location: 'Bindura', type: 'university' },
    { id: 'lsz', name: 'Lupane State University', location: 'Lupane', type: 'university' },
    { id: 'chu', name: 'Chinhoyi University of Technology', location: 'Chinhoyi', type: 'university' },
    { id: 'wua', name: 'Women\'s University in Africa', location: 'Harare', type: 'university' },
    { id: 'african', name: 'Africa University', location: 'Mutare', type: 'university' },
    { id: 'solusi', name: 'Solusi University', location: 'Bulawayo', type: 'university' },
    { id: 'zou', name: 'Zimbabwe Open University', location: 'Harare', type: 'university' },
    { id: 'reformed', name: 'Reformed Church University', location: 'Masvingo', type: 'university' },
    { id: 'marondera', name: 'Marondera University of Agricultural Sciences and Technology', location: 'Marondera', type: 'university' },
    { id: 'gwanda', name: 'Gwanda State University', location: 'Gwanda', type: 'university' },
    { id: 'manicaland', name: 'Manicaland State University of Applied Sciences', location: 'Mutare', type: 'university' },
  
    // Polytechnics
    { id: 'hararepoly', name: 'Harare Polytechnic', location: 'Harare', type: 'polytechnic' },
    { id: 'bulawayopoly', name: 'Bulawayo Polytechnic', location: 'Bulawayo', type: 'polytechnic' },
    { id: 'mutarepoly', name: 'Mutare Polytechnic', location: 'Mutare', type: 'polytechnic' },
    { id: 'masvingopoly', name: 'Masvingo Polytechnic', location: 'Masvingo', type: 'polytechnic' },
    { id: 'kwekwepoly', name: 'Kwekwe Polytechnic', location: 'Kwekwe', type: 'polytechnic' },
    { id: 'gwerupoly', name: 'Gweru Polytechnic', location: 'Gweru', type: 'polytechnic' },
  
    // Teacher Training Colleges
    { id: 'belvedere', name: 'Belvedere Technical Teachers College', location: 'Harare', type: 'teachers_college' },
    { id: 'danhiko', name: 'Danhiko Technical Teachers College', location: 'Mutare', type: 'teachers_college' },
    { id: 'chinhoyi_ttc', name: 'Chinhoyi Technical Teachers College', location: 'Chinhoyi', type: 'teachers_college' },
    { id: 'joshua_mqabuko', name: 'Joshua Mqabuko Nkomo Polytechnic', location: 'Bulawayo', type: 'teachers_college' },
    { id: 'mkoba', name: 'Mkoba Teachers College', location: 'Gweru', type: 'teachers_college' },
    { id: 'morgenster', name: 'Morgenster Teachers College', location: 'Masvingo', type: 'teachers_college' },
    { id: 'seke', name: 'Seke Teachers College', location: 'Chitungwiza', type: 'teachers_college' },
    { id: 'hillside', name: 'Hillside Teachers College', location: 'Bulawayo', type: 'teachers_college' },
    { id: 'bondolfi', name: 'Bondolfi Teachers College', location: 'Masvingo', type: 'teachers_college' },
    { id: 'united', name: 'United College of Education', location: 'Bulawayo', type: 'teachers_college' },
    { id: 'marymount', name: 'Marymount Teachers College', location: 'Mutare', type: 'teachers_college' },
  
    // Adult Education and Training Centers
    { id: 'zimta', name: 'Zimbabwe Teachers Association Training Center', location: 'Harare', type: 'adult_education' },
    { id: 'speciss', name: 'Speciss College', location: 'Harare', type: 'adult_education' },
    { id: 'zcm', name: 'Zimbabwe College of Music', location: 'Harare', type: 'adult_education' },
    { id: 'zils', name: 'Zimbabwe Institute of Legal Studies', location: 'Harare', type: 'adult_education' },
    { id: 'trust_academy', name: 'Trust Academy', location: 'Harare', type: 'adult_education' },
    { id: 'herentials', name: 'Herentials College', location: 'Harare', type: 'adult_education' },
    { id: 'lighthouse', name: 'Lighthouse College', location: 'Harare', type: 'adult_education' },
    { id: 'phoenix', name: 'Phoenix College', location: 'Harare', type: 'adult_education' },
    { id: 'citma', name: 'CITMA College', location: 'Harare', type: 'adult_education' },
    { id: 'ilsa', name: 'ILSA College', location: 'Harare', type: 'adult_education' },
    { id: 'zwem', name: 'Zimbabwe Women Empowerment Institution', location: 'Harare', type: 'adult_education' },
    { id: 'montrouse', name: 'Montrouse College', location: 'Harare', type: 'adult_education' },
  
    // Vocational Training Centers
    { id: 'copperbelt', name: 'Copperbelt University College', location: 'Chegutu', type: 'vocational' },
    { id: 'churchill', name: 'Churchill College', location: 'Harare', type: 'vocational' },
    { id: 'amac', name: 'Amac Training Center', location: 'Harare', type: 'vocational' },
    { id: 'success', name: 'Success College', location: 'Harare', type: 'vocational' },
    { id: 'damelin', name: 'Damelin College', location: 'Harare', type: 'vocational' },
    { id: 'regent', name: 'Regent Business School', location: 'Harare', type: 'vocational' },
    { id: 'women_tech', name: 'Women\'s Technology Training Institute', location: 'Harare', type: 'vocational' },
  
    // Industrial Training Centers
    { id: 'itc_harare', name: 'Industrial Training Center Harare', location: 'Harare', type: 'industrial_training' },
    { id: 'itc_bulawayo', name: 'Industrial Training Center Bulawayo', location: 'Bulawayo', type: 'industrial_training' },
    { id: 'itc_mutare', name: 'Industrial Training Center Mutare', location: 'Mutare', type: 'industrial_training' },
    { id: 'itc_gweru', name: 'Industrial Training Center Gweru', location: 'Gweru', type: 'industrial_training' },
  
    // Agricultural Training Centers
    { id: 'blackfordby', name: 'Blackfordby Agricultural College', location: 'Chegutu', type: 'agricultural' },
    { id: 'esigodini', name: 'Esigodini Agricultural College', location: 'Esigodini', type: 'agricultural' },
    { id: 'mazowe', name: 'Mazowe Agricultural College', location: 'Mazowe', type: 'agricultural' },
    { id: 'gwebi', name: 'Gwebi Agricultural College', location: 'Mazowe', type: 'agricultural' },
    { id: 'kushinga', name: 'Kushinga Phikelela Agricultural College', location: 'Centenary', type: 'agricultural' },
  
    // Health Training Institutions
    { id: 'sally_mugabe', name: 'Sally Mugabe School of Nursing', location: 'Harare', type: 'health_training' },
    { id: 'mpilo', name: 'Mpilo School of Nursing', location: 'Bulawayo', type: 'health_training' },
    { id: 'parirenyatwa', name: 'Parirenyatwa School of Nursing', location: 'Harare', type: 'health_training' },
    { id: 'chitungwiza', name: 'Chitungwiza School of Nursing', location: 'Chitungwiza', type: 'health_training' },
    { id: 'gweru_nursing', name: 'Gweru School of Nursing', location: 'Gweru', type: 'health_training' },
  
    // Business and Management Training
    { id: 'zimdef', name: 'Zimbabwe Institute of Development Studies', location: 'Harare', type: 'business_training' },
    { id: 'productivity', name: 'Zimbabwe National Productivity Institute', location: 'Harare', type: 'business_training' },
    { id: 'management', name: 'Zimbabwe Management Development Institute', location: 'Harare', type: 'business_training' },
    { id: 'public_admin', name: 'Institute of Public Administration and Management', location: 'Harare', type: 'business_training' },
  
    // Religious Training Institutions
    { id: 'theological', name: 'United Theological College', location: 'Harare', type: 'religious' },
    { id: 'evangelical', name: 'Evangelical Bible College', location: 'Harare', type: 'religious' },
    { id: 'domboshawa', name: 'Domboshawa Training Institute', location: 'Domboshawa', type: 'religious' },
  
    // Adult Literacy Centers (major ones)
    { id: 'adult_literacy_harare', name: 'Adult Literacy Center Harare', location: 'Harare', type: 'adult_literacy' },
    { id: 'adult_literacy_bulawayo', name: 'Adult Literacy Center Bulawayo', location: 'Bulawayo', type: 'adult_literacy' },
    { id: 'adult_literacy_mutare', name: 'Adult Literacy Center Mutare', location: 'Mutare', type: 'adult_literacy' },
    { id: 'adult_literacy_gweru', name: 'Adult Literacy Center Gweru', location: 'Gweru', type: 'adult_literacy' },
    { id: 'adult_literacy_masvingo', name: 'Adult Literacy Center Masvingo', location: 'Masvingo', type: 'adult_literacy' },
  ];
  
  export default ZIM_UNIVERSITIES;