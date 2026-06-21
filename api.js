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

/**
 * 指定体験の空き枠一覧を取得
 * @param {string} experienceId
 * @returns {Promise<Array>}
 */
export async function getAvailableSlots(experienceId) {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_experience_id: experienceId
  })
  if (error) throw error
  return data ?? []
}

// -----------------------------------------------
// 管理画面用
// -----------------------------------------------

/**
 * 体験内容一覧を取得（非公開も含む全件・管理用）
 * @returns {Promise<Array>}
 */
export async function adminGetExperiences() {
  const { data, error } = await supabase.rpc('admin_get_experiences')
  if (error) throw error
  return data ?? []
}

/**
 * 体験内容を新規作成
 * @param {Object} e
 * @returns {Promise<string>} 作成されたID
 */
export async function adminInsertExperience(e) {
  const { data, error } = await supabase.rpc('admin_insert_experience', {
    p_title:          e.タイトル,
    p_subtitle:       e.見出し説明,
    p_image_url:      e.image_url,
    p_price:          e.料金,
    p_duration:       e.所要時間,
    p_schedule:       e.スケジュール,
    p_detail:         e.体験内容詳細,
    p_notice:         e.注意事項,
    p_belongings:     e.持ち物,
    p_place:          e.体験場所,
    p_meeting_place:  e.集合場所
  })
  if (error) throw error
  return data
}

/**
 * 体験内容を更新
 * @param {string} id
 * @param {Object} e
 */
export async function adminUpdateExperience(id, e) {
  const { error } = await supabase.rpc('admin_update_experience', {
    p_id:             id,
    p_title:          e.タイトル,
    p_subtitle:       e.見出し説明,
    p_image_url:      e.image_url,
    p_price:          e.料金,
    p_duration:       e.所要時間,
    p_schedule:       e.スケジュール,
    p_detail:         e.体験内容詳細,
    p_notice:         e.注意事項,
    p_belongings:     e.持ち物,
    p_place:          e.体験場所,
    p_meeting_place:  e.集合場所
  })
  if (error) throw error
}

/**
 * 体験内容の公開/非公開を切り替え
 * @param {string} id
 * @param {boolean} visible
 */
export async function adminToggleExperienceVisibility(id, visible) {
  const { error } = await supabase.rpc('admin_toggle_experience_visibility', {
    p_id: id,
    p_visible: visible
  })
  if (error) throw error
}

/**
 * 体験内容を削除
 * @param {string} id
 */
export async function adminDeleteExperience(id) {
  const { error } = await supabase.rpc('admin_delete_experience', { p_id: id })
  if (error) throw error
}

/**
 * 予約枠を新規作成
 * @param {Object} params
 * @param {string} params.experienceId
 * @param {string} params.date      - 'YYYY-MM-DD'
 * @param {string} params.startTime - 'HH:mm:ss'
 * @param {string} params.endTime   - 'HH:mm:ss'
 * @param {number} params.capacity
 */
export async function adminInsertSlot(params) {
  const { data, error } = await supabase.rpc('admin_insert_slot', {
    p_experience_id: params.experienceId,
    p_date:          params.date,
    p_start_time:    params.startTime,
    p_end_time:      params.endTime,
    p_capacity:      params.capacity
  })
  if (error) throw error
  return data
}

/**
 * 指定月の予約枠一覧を取得（予約状況つき）
 * @param {string} yearMonth - 'YYYY-MM'
 * @returns {Promise<Array>}
 */
export async function adminGetSlots(yearMonth) {
  const { data, error } = await supabase.rpc('admin_get_slots', {
    p_year_month: yearMonth
  })
  if (error) throw error
  return data ?? []
}

/**
 * 予約枠を削除
 * @param {string} id
 */
export async function adminDeleteSlot(id) {
  const { error } = await supabase.rpc('admin_delete_slot', { p_id: id })
  if (error) throw error
}
