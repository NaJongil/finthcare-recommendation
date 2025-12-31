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
    
    // 디버깅: 환경변수 확인
    if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TOKEN) {
        return res.status(500).json({ 
            error: 'Config error',
            hasBaseId: !!process.env.AIRTABLE_BASE_ID,
            hasToken: !!process.env.AIRTABLE_TOKEN
        });
    }
    
    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }
    
    try {
        const recordId = 'rec' + key;
        const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/RequestSpecialist/${recordId}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        // 디버깅: Airtable 응답 상태
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: 'Airtable error',
                status: response.status,
                detail: errorText,
                url: url.replace(process.env.AIRTABLE_TOKEN, '***')
            });
        }
        
        const record = await response.json();
        const fields = record.fields;
        
        // action=verify: 전화번호 인증
        if (action === 'verify') {
            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required' });
            }
            
            const normalizedInput = phone.replace(/[-\s]/g, '');
            const normalizedStored = (fields.RequesterPhone || '').replace(/[-\s]/g, '');
            
            if (normalizedInput !== normalizedStored) {
                return res.status(401).json({ 
                    error: 'Unauthorized',
                    message: '전화번호가 일치하지 않습니다.'
                });
            }
            
            return res.status(200).json({
                success: true,
                data: {
                    patientName: fields.PatientName || '',
                    diseaseName: fields.DiseaseName || '',
                    diseaseCode: fields.DiseaseCode || '',
                    referralNote: fields.ReferralNote || '',
                    hospital1: fields.Hospital1 || '',
                    department1: fields.Department1 || '',
                    specialist1: fields.Specialist1 || '',
                    appointment1: fields.Appointment1 || '',
                    doctorProfile1: fields.DoctorProfile1 || '',
                    recommendReason1: fields.RecommendReason1 || '',
                    hospital2: fields.Hospital2 || '',
                    department2: fields.Department2 || '',
                    specialist2: fields.Specialist2 || '',
                    appointment2: fields.Appointment2 || '',
                    doctorProfile2: fields.DoctorProfile2 || '',
                    recommendReason2: fields.RecommendReason2 || '',
                    hospital3: fields.Hospital3 || '',
                    department3: fields.Department3 || '',
                    specialist3: fields.Specialist3 || '',
                    appointment3: fields.Appointment3 || '',
                    doctorProfile3: fields.DoctorProfile3 || '',
                    recommendReason3: fields.RecommendReason3 || ''
                }
            });
        }
        
        const patientName = fields.PatientName || '';
        const maskedName = patientName.length > 1 
            ? patientName.charAt(0) + '*'.repeat(patientName.length - 1)
            : patientName;
        
        res.status(200).json({
            exists: true,
            maskedName: maskedName
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Server error',
            message: error.message,
            stack: error.stack
        });
    }
};
