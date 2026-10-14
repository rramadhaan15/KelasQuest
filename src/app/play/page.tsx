'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StudentPortal } from '../../components/StudentPortal';
import { sharedStudioSoalService } from '../../domain/shared-service';

function PlayPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pin = searchParams.get('pin') || '';

  return (
    <StudentPortal
      initialPin={pin}
      service={sharedStudioSoalService}
      onBackToTeacher={() => router.push('/')}
    />
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0F1D', color: '#94A3B8', fontWeight: 700 }}>Memuat Arena Boss Battle KelasQuest...</div>}>
      <PlayPortalContent />
    </Suspense>
  );
}
