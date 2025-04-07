import { useState } from 'react';
import { profileService } from '@/lib/api/profile';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [mbti, setMbti] = useState('');
    const [message, setMessage] = useState('');

    const handleUpdate = async () => {
        try {
            await profileService.updateProfile({ email, mbti });
            setMessage('프로필이 성공적으로 업데이트되었습니다.');
        } catch (error) {
            setMessage('업데이트 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <h1>Settings Page</h1>
            <div>
                <label>
                    이메일:
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
            </div>
            <div>
                <label>
                    MBTI:
                    <input type="text" value={mbti} onChange={(e) => setMbti(e.target.value)} />
                </label>
            </div>
            <button onClick={handleUpdate}>업데이트</button>
            {message && <p>{message}</p>}
        </div>
    );
}