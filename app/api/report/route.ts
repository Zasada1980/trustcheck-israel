/**
 * API Route: Генерация отчета о надежности бизнеса
 * POST /api/report
 * 
 * Data Sources (hybrid strategy):
 * 1. PostgreSQL cache (data.gov.il) - fastest
 * 2. Real-time scraping (ica.justice.gov.il, court.gov.il) - accurate
 * 3. Mock data - fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateBusinessReport, extractKeyFacts } from '@/lib/gemini';
import { getBusinessData, checkDataSourcesHealth } from '@/lib/unified_data';
import { getMockBusinessData } from '@/lib/checkid';

export async function POST(req: NextRequest) {
  try {
    // Парсинг входных данных
    const body = await req.json();
    const { businessName, registrationNumber, additionalInfo } = body;

    // Валидация
    if (!businessName || businessName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Получение данных через unified service (PostgreSQL → All Gov Sources → Mock)
    console.log('[API] Fetching business data for:', businessName, registrationNumber);
    
    const businessData = await getBusinessData(registrationNumber || businessName, {
      includeLegal: true,       // Include legal cases and execution proceedings
      forceRefresh: false,      // Use cache if available
      includeAllSources: true,  // NEW: Include Bank of Israel, Tax Authority, Courts, Execution Office
      businessName,             // CRITICAL FIX: Pass original business name to preserve user input
    });

    if (!businessData) {
      return NextResponse.json(
        { error: 'Business not found in any data source' },
        { status: 404 }
      );
    }

    console.log('[API] Data source:', businessData.dataSource, '| Quality:', businessData.dataQuality);

    // Преобразование unified data в CheckID формат для совместимости с Gemini
    const checkIDCompatibleData: import('@/lib/checkid').CheckIDBusinessData = {
      registrationNumber: businessData.hpNumber,
      name: businessData.nameHebrew,
      type: businessData.companyType as 'עוסק פטור' | 'עוסק מורשה' | 'חברה בע"מ' | 'שותפות רשומה',
      status: businessData.status as 'active' | 'inactive' | 'suspended' | 'liquidation' | 'dissolved' | 'violating',
      foundedDate: businessData.registrationDate,
      address: {
        street: businessData.address.street || '',
        city: businessData.address.city || '',
        zipCode: businessData.address.zipcode,
      },
      industry: businessData.industry,
      owners: businessData.owners,
      
      // CRITICAL FIX: Build risks array based on actual risk indicators
      risks: [
        ...(businessData.riskIndicators.isCompanyViolating ? ['⚠️ חברה מפרת חוק - CRITICAL RISK!'] : []),
        ...(businessData.riskIndicators.hasRestrictedBankAccount ? ['חשבון בנק מוגבל'] : []),
        ...(businessData.riskIndicators.hasActiveLegalCases ? ['תיקים משפטיים פעילים'] : []),
        ...(businessData.riskIndicators.hasExecutionProceedings ? ['הוצאה לפועל'] : []),
        ...(businessData.riskIndicators.hasHighDebt ? ['חוב גבוה'] : []),
        ...(businessData.riskIndicators.hasBankruptcyProceedings ? ['הליכי פשיטת רגל'] : []),
      ],
      
      strengths: businessData.riskIndicators.isCompanyViolating 
        ? []
        : ['פעילה ללא תיקים משפטיים', 'סטטוס תקין'],
    };

    // Генерация отчета с помощью Gemini
    console.log('[API] Generating AI report for:', businessData.nameHebrew);
    const report = await generateBusinessReport(checkIDCompatibleData);

    // Извлечение ключевых фактов
    const keyFacts = await extractKeyFacts(report);

    // Возврат результата с расширенными данными
    return NextResponse.json({
      success: true,
      businessData: {
        ...checkIDCompatibleData,
        
        // Add regulatory compliance fields
        nameEnglish: businessData.nameEnglish,
        violations: businessData.violations,  // "מפרה" if violating
        violationsCode: businessData.violationsCode,  // Code 18
        limitations: businessData.limitations,
        governmentCompany: businessData.governmentCompany,
        lastAnnualReport: businessData.lastAnnualReport,
        businessDescription: businessData.businessDescription,
        businessPurpose: businessData.businessPurpose,
        
        // Legal and financial data
        legalIssues: businessData.legalIssues,
        riskIndicators: businessData.riskIndicators,
        taxStatus: businessData.taxStatus,
        bankingStatus: businessData.bankingStatus,
      },
      aiAnalysis: {
        rating: keyFacts.trustScore,
        risks: keyFacts.risks,
        strengths: keyFacts.strengths,
        recommendation: keyFacts.recommendation,
        fullReport: report,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-2.0-flash',
        dataSource: businessData.dataSource,
        dataQuality: businessData.dataQuality,
        cacheHit: businessData.cacheHit,
        lastUpdated: businessData.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);

    // Проверка типа ошибки
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to generate report',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS для CORS (если нужно)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
