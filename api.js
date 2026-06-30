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
 * 利用規約への同意を記録
 * @param {string} lineUserId
 */
export async function agreeToTerms(lineUserId) {
  const { error } = await supabase.rpc('agree_to_terms', {
    p_line_user_id: lineUserId
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
 * @param {string} params.slotId        - 予約枠のUUID
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
    p_slot_id:        params.slotId,
    p_date:           params.date,
    p_time:           params.time,
    p_name:           params.name,
    p_content:        params.content,
    p_count:          params.count
  })
  if (error) throw error
}

/**
 * 指定期間に空き枠がある体験一覧を取得
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate   - 'YYYY-MM-DD'
 * @returns {Promise<Array>}
 */
export async function getExperiencesWithSlotsInRange(startDate, endDate) {
  const { data, error } = await supabase.rpc('get_experiences_with_slots_in_range', {
    p_start_date: startDate,
    p_end_date: endDate
  })
  if (error) throw error
  return data ?? []
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

/**
 * 予約をキャンセル（本人のLINE USER IDと一致する場合のみ）
 * @param {string} reservationId
 * @param {string} lineUserId
 */
export async function cancelReservation(reservationId, lineUserId) {
  const { error } = await supabase.rpc('cancel_reservation', {
    p_reservation_id: reservationId,
    p_line_user_id: lineUserId
  })
  if (error) throw error
}

// -----------------------------------------------
// 画像アップロード（Supabase Storage）
// -----------------------------------------------

const IMAGE_BUCKET = 'experience-images'

/**
 * 画像をSupabase Storageにアップロードし、公開URLを返す
 * @param {File} file
 * @returns {Promise<string>} 公開URL
 */
export async function uploadExperienceImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase
    .storage
    .from(IMAGE_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase
    .storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(fileName)

  return data.publicUrl
}

// -----------------------------------------------
// 管理ユーザー（ログイン・権限）
// -----------------------------------------------

/**
 * ログイン認証
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object|null>} { id, ユーザー名, 権限 } or null
 */
export async function adminLogin(username, password) {
  const { data, error } = await supabase.rpc('admin_login', {
    p_username: username,
    p_password: password
  })
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * 管理ユーザーを新規作成
 * @param {string} username
 * @param {string} password
 * @param {string} role - 'admin' or 'staff'
 */
export async function adminCreateUser(username, password, role) {
  const { data, error } = await supabase.rpc('admin_create_user', {
    p_username: username,
    p_password: password,
    p_role: role
  })
  if (error) throw error
  return data
}

/**
 * 管理ユーザー一覧を取得
 * @returns {Promise<Array>}
 */
export async function adminGetUsers() {
  const { data, error } = await supabase.rpc('admin_get_users')
  if (error) throw error
  return data ?? []
}

/**
 * 管理ユーザーを削除
 * @param {string} id
 */
export async function adminDeleteUser(id) {
  const { error } = await supabase.rpc('admin_delete_user', { p_id: id })
  if (error) throw error
}

/**
 * パスワードを再設定
 * @param {string} id
 * @param {string} newPassword
 */
export async function adminResetPassword(id, newPassword) {
  const { error } = await supabase.rpc('admin_reset_password', {
    p_id: id,
    p_new_password: newPassword
  })
  if (error) throw error
}

/**
 * 体験に担当者をアサイン
 * @param {string} experienceId
 * @param {string} userId
 */
export async function adminAssignStaff(experienceId, userId) {
  const { error } = await supabase.rpc('admin_assign_staff', {
    p_experience_id: experienceId,
    p_user_id: userId
  })
  if (error) throw error
}

/**
 * 体験の担当者を解除
 * @param {string} experienceId
 * @param {string} userId
 */
export async function adminUnassignStaff(experienceId, userId) {
  const { error } = await supabase.rpc('admin_unassign_staff', {
    p_experience_id: experienceId,
    p_user_id: userId
  })
  if (error) throw error
}

/**
 * 指定体験の担当者一覧を取得
 * @param {string} experienceId
 * @returns {Promise<Array>}
 */
export async function adminGetStaffForExperience(experienceId) {
  const { data, error } = await supabase.rpc('admin_get_staff_for_experience', {
    p_experience_id: experienceId
  })
  if (error) throw error
  return data ?? []
}

/**
 * 指定スタッフが担当している体験一覧を取得
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function adminGetMyExperiences(userId) {
  const { data, error } = await supabase.rpc('admin_get_my_experiences', {
    p_user_id: userId
  })
  if (error) throw error
  return data ?? []
}

/**
 * 予約情報一覧を取得（管理者は全件／スタッフは自分の担当体験のみ）
 * @param {string} userId
 * @param {boolean} isAdmin
 * @returns {Promise<Array>}
 */
export async function adminGetReservations(userId, isAdmin) {
  const { data, error } = await supabase.rpc('admin_get_reservations', {
    p_user_id: userId,
    p_is_admin: isAdmin
  })
  if (error) throw error
  return data ?? []
}

/**
 * 予約を受付済みにする（参加回数も+1される）
 * @param {string} reservationId
 */
export async function adminCheckInReservation(reservationId) {
  const { error } = await supabase.rpc('admin_check_in_reservation', {
    p_reservation_id: reservationId
  })
  if (error) throw error
}

// -----------------------------------------------
// 掲載申請
// -----------------------------------------------

/**
 * 申請を送信（スタッフ用）
 */
export async function adminSubmitApplication(userId, params) {
  const { data, error } = await supabase.rpc('admin_submit_application', {
    p_user_id:        userId,
    p_title:          params.タイトル,
    p_subtitle:       params.見出し説明,
    p_price:          params.料金,
    p_duration:       params.所要時間,
    p_detail:         params.体験内容詳細,
    p_notice:         params.注意事項,
    p_belongings:     params.持ち物,
    p_place:          params.体験場所,
    p_place_address:  params.体験場所住所,
    p_meeting_place:  params.集合場所,
    p_meeting_address: params.集合場所住所,
    p_contact:        params.連絡先
  })
  if (error) throw error
  return data
}

/**
 * 申請一覧を取得（admin用・全件）
 */
export async function adminGetApplications() {
  const { data, error } = await supabase.rpc('admin_get_applications')
  if (error) throw error
  return data ?? []
}

/**
 * 自分の申請一覧を取得（スタッフ用）
 */
export async function adminGetMyApplications(userId) {
  const { data, error } = await supabase.rpc('admin_get_my_applications', {
    p_user_id: userId
  })
  if (error) throw error
  return data ?? []
}

/**
 * 申請を承認（体験内容に非公開で追加）
 */
export async function adminApproveApplication(appId) {
  const { data, error } = await supabase.rpc('admin_approve_application', {
    p_app_id: appId
  })
  if (error) throw error
  return data
}

/**
 * 申請を却下
 */
export async function adminRejectApplication(appId, reason) {
  const { error } = await supabase.rpc('admin_reject_application', {
    p_app_id: appId,
    p_reason: reason
  })
  if (error) throw error
}

// -----------------------------------------------
// イベント
// -----------------------------------------------

/**
 * 開催中のイベント一覧を取得（一般ユーザー用・今日開催分）
 */
export async function getActiveEvents() {
  const { data, error } = await supabase.rpc('get_active_events')
  if (error) throw error
  return data ?? []
}

/**
 * 指定月のイベント一覧を取得（カレンダー表示用）
 * @param {string} yearMonth - 'YYYY-MM'
 */
export async function getEventsInMonth(yearMonth) {
  const { data, error } = await supabase.rpc('get_events_in_month', {
    p_year_month: yearMonth
  })
  if (error) throw error
  return data ?? []
}

/**
 * イベント一覧を取得（管理用・全件）
 */
export async function adminGetEvents() {
  const { data, error } = await supabase.rpc('admin_get_events')
  if (error) throw error
  return data ?? []
}

/**
 * イベントを新規作成
 */
export async function adminInsertEvent(params) {
  const { data, error } = await supabase.rpc('admin_insert_event', {
    p_title:        params.タイトル,
    p_description:  params.説明,
    p_image_url:    params.image_url,
    p_start_date:   params.開始日,
    p_end_date:     params.終了日,
    p_place:        params.場所
  })
  if (error) throw error
  return data
}

/**
 * イベントを更新
 */
export async function adminUpdateEvent(id, params) {
  const { error } = await supabase.rpc('admin_update_event', {
    p_id:           id,
    p_title:        params.タイトル,
    p_description:  params.説明,
    p_image_url:    params.image_url,
    p_start_date:   params.開始日,
    p_end_date:     params.終了日,
    p_place:        params.場所
  })
  if (error) throw error
}

/**
 * イベントの公開/非公開を切り替え
 */
export async function adminToggleEventVisibility(id, visible) {
  const { error } = await supabase.rpc('admin_toggle_event_visibility', {
    p_id: id,
    p_visible: visible
  })
  if (error) throw error
}

/**
 * イベントを削除
 */
export async function adminDeleteEvent(id) {
  const { error } = await supabase.rpc('admin_delete_event', { p_id: id })
  if (error) throw error
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
    p_place_address:  e.体験場所住所,
    p_meeting_place:  e.集合場所,
    p_meeting_address: e.集合場所住所
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
    p_place_address:  e.体験場所住所,
    p_meeting_place:  e.集合場所,
    p_meeting_address: e.集合場所住所
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
 * 予約枠を更新
 * @param {string} id
 * @param {Object} params
 * @param {string} params.date      - 'YYYY-MM-DD'
 * @param {string} params.startTime - 'HH:mm:ss'
 * @param {string} params.endTime   - 'HH:mm:ss'
 * @param {number} params.capacity
 */
export async function adminUpdateSlot(id, params) {
  const { error } = await supabase.rpc('admin_update_slot', {
    p_id:          id,
    p_date:        params.date,
    p_start_time:  params.startTime,
    p_end_time:    params.endTime,
    p_capacity:    params.capacity
  })
  if (error) throw error
}

/**
 * 予約枠を削除
 * @param {string} id
 */
export async function adminDeleteSlot(id) {
  const { error } = await supabase.rpc('admin_delete_slot', { p_id: id })
  if (error) throw error
}
