/**
 * TrustCheck Report API - Using Local Hebrew Model
 * POST /api/report/local
 * 
 * Использует локально обученную модель Qwen вместо Google Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBusinessData, type UnifiedBusinessData } from '@/lib/unified_data';
import { apiGenerateTrustReport } from '@/lib/trustcheck_local_model';

export async function POST(request: NextRequest) {
  try {
    const { hpNumber, query } = await request.json();

    if (!hpNumber) {
      return NextResponse.json(
        { error: 'hpNumber is required' },
        { status: 400 }
      );
    }

    console.log(`[TrustCheck Local Model] Generating report for: ${hpNumber}`);

    // 1. Получить данные о компании из БД
    let businessData: UnifiedBusinessData | null;
    try {
      businessData = await getBusinessData(hpNumber, {
        includeLegal: true,
        forceRefresh: false,
      });
      
      if (!businessData) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business data' },
        { status: 500 }
      );
    }

    // 2. Генерировать отчёт используя локальную модель
    const response = await apiGenerateTrustReport({
      nameHebrew: businessData.nameHebrew,
      hpNumber: businessData.hpNumber,
      businessType: businessData.companyType,
      status: businessData.status,
      registrationDate: businessData.registrationDate,
      address: businessData.address?.street || '',
      city: businessData.address?.city || '',
      legalCases: businessData.legalIssues?.activeCases || 0,
      executionProceedings: businessData.legalIssues?.executionProceedings || 0,
      violations: businessData.violations,
    });

    if (!response.success) {
      console.error('Model error:', response.error);
      
      // Fallback к Google Gemini если модель недоступна
      console.log('Falling back to Google Gemini...');
      // TODO: Импортировать и использовать Google Gemini as fallback
      
      return NextResponse.json(
        { 
          error: response.error || 'Failed to generate report',
          fallback: 'Please use /api/report endpoint for Google Gemini',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hpNumber,
      businessName: businessData.nameHebrew,
      report: response.report,
      model: 'Qwen2.5-1.5B-Instruct (Fine-tuned on TrustCheck Hebrew)',
      timestamp: response.timestamp,
      isLocalModel: true,
      features: {
        language: 'Hebrew (עברית)',
        offline: true,
        noApiCost: true,
        fastResponse: true,
      },
    });

  } catch (error) {
    console.error('[TrustCheck Local Model] Fatal error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/report/local/status
 * Проверить статус локальной модели
 */
export async function GET(request: NextRequest) {
  const { checkModelAvailability } = await import('@/lib/trustcheck_local_model');
  
  try {
    const available = await checkModelAvailability();
    
    return NextResponse.json({
      modelStatus: available ? 'ready' : 'not_found',
      modelPath: 'E:\\LLaMA-Factory\\saves\\qwen-trustcheck-hebrew\\lora\\sft',
      modelType: 'Qwen2.5-1.5B-Instruct (LoRA)',
      features: {
        hebrew: true,
        offline: true,
        fastInference: true,
        noSubscriptionNeeded: true,
      },
      recommendations: available 
        ? 'Ready to use. Use POST /api/report/local to generate reports'
        : 'Model not found. Run training script to create model.',
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check model status' },
      { status: 500 }
    );
  }
}
