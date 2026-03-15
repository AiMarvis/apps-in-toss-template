import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex DB 스키마 정의
 *
 * TODO: 앱 고유 테이블을 추가하세요.
 * 예) stocks, battles, votes, predictions 등
 */
export default defineSchema({
    // ── 사용자 ──
    users: defineTable({
        firebaseUid: v.string(),
        displayName: v.optional(v.string()),
        photoUrl: v.optional(v.string()),
        lastLoginAt: v.number(), // Date.now()
        createdAt: v.number(),
        // TODO: 앱 고유 사용자 필드 추가
        // isPremium: v.optional(v.boolean()),
        // totalScore: v.optional(v.number()),
    }).index('by_firebase_uid', ['firebaseUid']),

    // TODO: 앱 고유 테이블 추가
    // ── 앱 데이터 예시 ──
    // items: defineTable({
    //   userId: v.id('users'),
    //   title: v.string(),
    //   description: v.optional(v.string()),
    //   status: v.union(v.literal('active'), v.literal('completed')),
    //   createdAt: v.number(),
    // }).index('by_user', ['userId']),
});
