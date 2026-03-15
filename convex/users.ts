import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * 사용자 조회 또는 생성 (upsert)
 *
 * 토스 로그인 후 클라이언트에서 호출합니다.
 * 이미 존재하면 lastLoginAt만 갱신합니다.
 */
export const getOrCreate = mutation({
    args: {
        firebaseUid: v.string(),
        displayName: v.optional(v.string()),
        photoUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('users')
            .withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', args.firebaseUid))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                lastLoginAt: Date.now(),
                ...(args.displayName ? { displayName: args.displayName } : {}),
                ...(args.photoUrl ? { photoUrl: args.photoUrl } : {}),
            });
            return existing._id;
        }

        return await ctx.db.insert('users', {
            firebaseUid: args.firebaseUid,
            displayName: args.displayName,
            photoUrl: args.photoUrl,
            lastLoginAt: Date.now(),
            createdAt: Date.now(),
        });
    },
});

/**
 * 현재 사용자 정보 조회
 */
export const me = query({
    args: { firebaseUid: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('users')
            .withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', args.firebaseUid))
            .unique();
    },
});

/**
 * 사용자 데이터 삭제 (연동 해제 / 탈퇴 시)
 *
 * TODO: 앱 고유 데이터도 함께 삭제해야 합니다.
 */
export const deleteUser = mutation({
    args: { firebaseUid: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query('users')
            .withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', args.firebaseUid))
            .unique();

        if (user) {
            // TODO: 관련 앱 데이터 삭제
            // const items = await ctx.db.query('items').withIndex('by_user', q => q.eq('userId', user._id)).collect();
            // for (const item of items) { await ctx.db.delete(item._id); }
            await ctx.db.delete(user._id);
        }
    },
});
