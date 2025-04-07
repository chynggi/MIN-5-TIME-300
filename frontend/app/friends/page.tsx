"use client";
import { useEffect, useState } from 'react';
import { profileService } from '@/lib/api/profile';

export default function FriendsPage() {
    const [friends, setFriends] = useState<string[]>([]); // 친구 목록을 문자열 배열로 설정
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await profileService.getProfile();
                const friendCount = response.stats?.friendCount;
                if (Array.isArray(friendCount)) {
                    setFriends(friendCount);
                } else {
                    setFriends([]); // friendCount가 배열이 아니면 빈 배열로 설정
                }
            } catch (err) {
                setError('친구 목록을 불러오는 중 오류가 발생했습니다.');
            }
        };
        fetchFriends();
    }, []);

    return (
        <div>
            <h1>Friends Management Page</h1>
            {error && <p>{error}</p>}
            <ul>
                {friends.map((friend, index) => (
                    <li key={index}>{friend}</li>
                ))}
            </ul>
        </div>
    );
}