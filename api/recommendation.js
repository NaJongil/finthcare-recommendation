module.exports = async (req, res) => {
    const { key, phone, action } = req.query;
    
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }
    
    try {
        // Airtable에서 레코드 직접 조회 (key = RECORD_ID에서 'rec' 제외한 값)
        const recordId = 'rec' + key;
        const response = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/RequestSpecialist/${recordId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({
                    error: 'Not found',
                    message: '추천서를 찾을 수 없습니다.'
                });
            }
            throw new Error(`Airtable API error: ${response.status}`);
        }

        const record = await response.json();
        
        const fields = record.fields;
        
        // action=verify: 전화번호 인증
        if (action === 'verify') {
            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required' });
            }
            
            // 전화번호 정규화 (하이픈, 공백 제거)
            const normalizedInput = phone.replace(/[-\s]/g, '');
            const normalizedRequester = (fields.RequesterPhone || '').replace(/[-\s]/g, '');
            const normalizedPlanner = (fields.PlannerPhone || '').replace(/[-\s]/g, '');

            if (normalizedInput !== normalizedRequester && normalizedInput !== normalizedPlanner) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: '전화번호가 일치하지 않습니다.'
                });
            }
            
            // 인증 성공: 전체 데이터 반환
            return res.status(200).json({
                success: true,
                data: {
                    patientName: fields.PatientName || '',
                    diseaseName: fields.DiseaseName || '',
                    diseaseCode: fields.DiseaseCode || '',
                    referralNote: fields.ReferralNote || '',
                    
                    // 의사 1
                    hospital1: fields.Hospital1 || '',
                    department1: fields.Department1 || '',
                    specialist1: fields.Specialist1 || '',
                    appointment1: fields.Appointment1 || '',
                    doctorProfile1: fields.DoctorProfile1 || '',
                    recommendReason1: fields.RecommendReason1 || '',
                    
                    // 의사 2
                    hospital2: fields.Hospital2 || '',
                    department2: fields.Department2 || '',
                    specialist2: fields.Specialist2 || '',
                    appointment2: fields.Appointment2 || '',
                    doctorProfile2: fields.DoctorProfile2 || '',
                    recommendReason2: fields.RecommendReason2 || '',
                    
                    // 의사 3
                    hospital3: fields.Hospital3 || '',
                    department3: fields.Department3 || '',
                    specialist3: fields.Specialist3 || '',
                    appointment3: fields.Appointment3 || '',
                    doctorProfile3: fields.DoctorProfile3 || '',
                    recommendReason3: fields.RecommendReason3 || ''
                }
            });
        }
        
        // 기본 요청: 레코드 존재 확인만 (환자 이름 마스킹해서 반환)
        const patientName = fields.PatientName || '';
        const maskedName = patientName.length > 1 
            ? patientName.charAt(0) + '*'.repeat(patientName.length - 1)
            : patientName;
        
        res.status(200).json({
            exists: true,
            maskedName: maskedName
        });
        
    } catch (error) {
        console.error('Airtable API Error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: '추천서 정보를 가져오는 중 오류가 발생했습니다.'
        });
    }
};
