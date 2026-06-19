// api.js
// Supabaseとの通信は全て .rpc() 経由（テーブル直接アクセス禁止）
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// -----------------------------------------------
// 体験内容
// -----------------------------------------------

/**
 * 体験内容一覧を取得
 * @returns {Promise<Array>}
 */
export async function getExperiences() {
  const { data, error } = await supabase.rpc('get_experiences')
  if (error) throw error
  return data ?? []
}

// -----------------------------------------------
// 会員情報
// -----------------------------------------------

/**
 * LINE USER IDで会員情報を取得
 * @param {string} lineUserId
 * @returns {Promise<Object|null>}
 */
export async function getMember(lineUserId) {
  const { data, error } = await supabase.rpc('get_member', {
    p_line_user_id: lineUserId
  })
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * 会員のステータスを取得（参加回数で自動判定）
 * @param {string} lineUserId
 * @returns {Promise<Object|null>}
 */
export async function getMemberStatus(lineUserId) {
  const { data, error } = await supabase.rpc('get_member_status', {
    p_line_user_id: lineUserId
  })
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * 会員登録（既に登録済みの場合はスキップ）
 * @param {string} lineUserId
 * @param {string} userName
 */
export async function insertMember(lineUserId, userName) {
  const { error } = await supabase.rpc('insert_member', {
    p_line_user_id: lineUserId,
    p_user_name: userName
  })
  if (error) throw error
}

/**
 * 参加回数を+1する（クライアントから値を指定させない）
 * @param {string} lineUserId
 */
export async function incrementVisitCount(lineUserId) {
  const { error } = await supabase.rpc('increment_visit_count', {
    p_line_user_id: lineUserId
  })
  if (error) throw error
}

// -----------------------------------------------
// 予約情報
// -----------------------------------------------

/**
 * 会員の予約一覧を取得
 * @param {string} lineUserId
 * @returns {Promise<Array>}
 */
export async function getReservations(lineUserId) {
  const { data, error } = await supabase.rpc('get_reservations', {
    p_line_user_id: lineUserId
  })
  if (error) throw error
  return data ?? []
}

/**
 * 予約を登録する
 * @param {Object} params
 * @param {string} params.lineUserId
 * @param {string} params.experienceId  - 体験内容のUUID
 * @param {string} params.date          - 例: '2026-07-01'
 * @param {string} params.time          - 例: '10:00:00'
 * @param {string} params.name          - 氏名
 * @param {string} params.content       - 予約内容（メモなど）
 * @param {number} params.count         - 人数
 */
export async function insertReservation(params) {
  const { error } = await supabase.rpc('insert_reservation', {
    p_line_user_id:   params.lineUserId,
    p_experience_id:  params.experienceId,
    p_date:           params.date,
    p_time:           params.time,
    p_name:           params.name,
    p_content:        params.content,
    p_count:          params.count
  })
  if (error) throw error
}
