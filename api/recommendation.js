export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { key, action, phone } = req.query;

  if (!key) {
    return res.status(400).json({ error: 'Missing key parameter' });
  }

  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const tableId = process.env.AIRTABLE_TABLE_ID;

  const recordId = `rec${key}`;

  try {
    // Airtable에서 레코드 조회
    const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
    const response = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Record not found', exists: false });
    }

    const record = await response.json();
    const fields = record.fields;

    // 인증 전: 마스킹된 이름만 반환
    if (!action) {
      const patientName = fields['PatientName'] || '고객';
      const maskedName = patientName.charAt(0) + '**';
      
      return res.status(200).json({
        exists: true,
        maskedName: maskedName
      });
    }

    // 전화번호 인증
    if (action === 'verify') {
      const requesterPhone = fields['RequesterPhone'] || '';
      const patientPhone = fields['PatientPhone'] || '';
      const inputPhone = (phone || '').replace(/[^0-9]/g, '');
      
      const normalizedRequesterPhone = requesterPhone.replace(/[^0-9]/g, '');
      const normalizedPatientPhone = patientPhone.replace(/[^0-9]/g, '');

      // RequesterPhone 또는 PatientPhone 중 하나라도 일치하면 인증 성공
      if (inputPhone === normalizedRequesterPhone || inputPhone === normalizedPatientPhone) {
        // 인증 성공 - 전체 데이터 반환
        return res.status(200).json({
          success: true,
          data: {
            patientName: fields['PatientName'] || '',
            diseaseName: fields['DiseaseName'] || '',
            referralSummary: fields['ReferralSummary'] || '',
            hospital1: fields['Hospital1'] || '',
            department1: fields['Department1'] || '',
            specialist1: fields['Specialist1'] || '',
            appointment1: fields['Appointment1'] || '',
            doctorProfile1: fields['DoctorProfile1'] || '',
            recommendReason1: fields['RecommendReason1'] || '',
            hospital2: fields['Hospital2'] || '',
            department2: fields['Department2'] || '',
            specialist2: fields['Specialist2'] || '',
            appointment2: fields['Appointment2'] || '',
            doctorProfile2: fields['DoctorProfile2'] || '',
            recommendReason2: fields['RecommendReason2'] || '',
            hospital3: fields['Hospital3'] || '',
            department3: fields['Department3'] || '',
            specialist3: fields['Specialist3'] || '',
            appointment3: fields['Appointment3'] || '',
            doctorProfile3: fields['DoctorProfile3'] || '',
            recommendReason3: fields['RecommendReason3'] || ''
          }
        });
      } else {
        return res.status(200).json({
          success: false,
          message: '전화번호가 일치하지 않습니다.'
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
