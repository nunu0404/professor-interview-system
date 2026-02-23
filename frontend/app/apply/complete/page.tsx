export default function CompletePage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="card fade-in" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
                <h1 style={{ fontSize: '1.6rem', marginBottom: 12 }}>신청이 완료됐어요!</h1>
                <p style={{ marginBottom: 24, lineHeight: 1.8 }}>
                    연구실 방문 세션 신청이 정상적으로 접수되었습니다.<br />
                    배정 결과는 행사 진행 중 안내해 드릴 예정이에요.
                </p>
                <div className="alert alert-info" style={{ marginBottom: 24, textAlign: 'left' }}>
                    <strong>📌 안내</strong><br />
                    <span style={{ fontSize: '0.85rem' }}>
                        Session 배정 결과는 당일 포스터 발표 종료 후 개인별로 안내됩니다.
                        배정된 연구실 포스터 앞에서 대기해 주세요.
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <a href="/apply/edit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        ✏️ 희망 연구실 수정하기
                    </a>
                    <a href="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        ← 처음으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    );
}
