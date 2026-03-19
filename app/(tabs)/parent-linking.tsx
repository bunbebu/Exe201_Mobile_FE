import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/use-colors';

type LinkCodeRes = { linkCode: string; expiresAt: string };

type ParentLink = {
  linkId: string;
  parentProfileId: string;
  fullName: string;
  phoneNumber?: string;
  linkedAt: string;
};

type ChildLink = {
  linkId: string;
  studentProfileId: string;
  fullName: string;
  gradeLevel?: string;
  schoolName?: any;
  xpTotal?: number;
  currentStreak?: number;
  linkedAt: string;
};

type ChildProgress = {
  studentProfileId: string;
  fullName: string;
  gradeLevel?: string;
  schoolName?: any;
  xpTotal?: number;
  currentStreak?: number;
  diamondBalance?: number;
  periodStart: string;
  periodEnd: string;
  lessonsStarted?: number;
  lessonsCompleted?: number;
  totalWatchMinutes?: number;
  quizzesAttempted?: number;
  avgQuizScore?: number;
  xpEarnedThisPeriod?: number;
  highlightText?: string;
};

async function readErrorText(res: Response) {
  try {
    const txt = await res.text();
    return txt || '';
  } catch {
    return '';
  }
}

export default function ParentLinkingScreen() {
  const colors = useColors();
  const { tokens, user } = useAuth();

  const authHeader = useMemo(() => {
    const t = tokens?.accessToken;
    return t ? { Authorization: `Bearer ${t}` } : null;
  }, [tokens?.accessToken]);

  const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
  const isParent = (user?.role || '').toUpperCase() === 'PARENT';

  const [isLoading, setIsLoading] = useState(true);
  const [linkCode, setLinkCode] = useState<LinkCodeRes | null>(null);
  const [myParents, setMyParents] = useState<ParentLink[]>([]);
  const [myChildren, setMyChildren] = useState<ChildLink[]>([]);

  // Step 1.5 (optional data): send code via SMS/Zalo
  const [parentPhone, setParentPhone] = useState('');
  const [sendChannel, setSendChannel] = useState<'zalo' | 'sms'>('zalo');

  const [connectCode, setConnectCode] = useState('');
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [progressLinkId, setProgressLinkId] = useState<string | null>(null);
  const [progressPeriod, setProgressPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const fetchAll = useCallback(async () => {
    if (!authHeader) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Student-side: list linked parents
      if (isStudent) {
        const parentsRes = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/my-parents`, {
          headers: authHeader,
        });
        if (parentsRes.ok) {
          const raw: any = await parentsRes.json();
          const list: ParentLink[] = Array.isArray(raw) ? raw : raw?.data ?? [];
          setMyParents(list);
        } else {
          setMyParents([]);
        }
      }

      // Parent-side: list linked children
      if (isParent) {
        const childrenRes = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/my-children`, {
          headers: authHeader,
        });
        if (childrenRes.ok) {
          const raw: any = await childrenRes.json();
          const list: ChildLink[] = Array.isArray(raw) ? raw : raw?.data ?? [];
          setMyChildren(list);
        } else {
          setMyChildren([]);
        }
      }
    } catch (e) {
      console.error('[PARENT_LINK] fetchAll error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [authHeader, isParent, isStudent]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const generateCode = async () => {
    if (!authHeader) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/generate-code`, {
        method: 'POST',
        headers: authHeader,
      });
      if (!res.ok) {
        const t = await readErrorText(res);
        throw new Error(t || 'Không thể tạo mã kết nối.');
      }
      const raw: any = await res.json();
      const data: LinkCodeRes = raw?.data ?? raw;
      if (!data?.linkCode) throw new Error('Không nhận được linkCode.');
      setLinkCode({ linkCode: data.linkCode, expiresAt: data.expiresAt });

      // Step 1.5 — must call generate-code/send after generating code.
      // Swagger description says it needs parent phone in E.164 and channel (sms|zalo),
      // but schema isn't shown in our swaggerdoc snapshot. We'll try best-effort:
      // - if user entered phone, send with JSON body
      // - otherwise, call without body (some backends may infer) and fallback to manual send UI if it fails.
      try {
        const sendHeaders: Record<string, string> = {
          ...authHeader,
          'Content-Type': 'application/json',
        };
        const hasPhone = !!parentPhone.trim();
        const sendRes = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/generate-code/send`, {
          method: 'POST',
          headers: sendHeaders,
          body: hasPhone
            ? JSON.stringify({ phoneNumber: parentPhone.trim(), channel: sendChannel })
            : undefined,
        });
        if (!sendRes.ok) {
          const t = await readErrorText(sendRes);
          // Don't block code generation; just inform how to proceed.
          console.warn('[PARENT_LINK] send code failed:', t);
        }
      } catch (err) {
        console.warn('[PARENT_LINK] send code error:', err);
      }

      Alert.alert('Thành công', 'Mã kết nối đã sẵn sàng. Bạn có thể gửi mã này cho phụ huynh.');
    } catch (e: any) {
      console.error('[PARENT_LINK] generateCode error:', e);
      Alert.alert('Lỗi', e?.message ?? 'Không thể tạo mã kết nối.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendCode = async () => {
    if (!authHeader) return;
    const phone = parentPhone.trim();
    if (!phone) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại phụ huynh (E.164, VD: +84901234567).');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/generate-code/send`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, channel: sendChannel }),
      });
      if (!res.ok) {
        const t = await readErrorText(res);
        throw new Error(t || 'Không thể gửi mã qua SMS/Zalo.');
      }
      Alert.alert('Đã gửi', `Đã gửi mã kết nối qua ${sendChannel.toUpperCase()} (nếu backend hỗ trợ).`);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể gửi mã.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectByCode = async () => {
    if (!authHeader) return;
    const code = connectCode.trim().toUpperCase();
    if (code.length !== 8) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã 8 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/connect`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const t = await readErrorText(res);
        throw new Error(t || 'Mã không hợp lệ / đã hết hạn / đã liên kết.');
      }
      Alert.alert('Thành công', 'Đã kết nối với học sinh.');
      setConnectCode('');
      await fetchAll();
    } catch (e: any) {
      console.error('[PARENT_LINK] connectByCode error:', e);
      Alert.alert('Lỗi', e?.message ?? 'Không thể kết nối.');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeLinkAsStudent = async (linkId: string) => {
    if (!authHeader) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/my-children/${linkId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (!res.ok) {
        const t = await readErrorText(res);
        throw new Error(t || 'Không thể huỷ liên kết.');
      }
      Alert.alert('Đã huỷ', 'Liên kết đã được gỡ.');
      await fetchAll();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể huỷ liên kết.');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeLinkAsParent = async (linkId: string) => {
    if (!authHeader) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/my-parents/${linkId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (!res.ok) {
        const t = await readErrorText(res);
        throw new Error(t || 'Không thể huỷ liên kết.');
      }
      Alert.alert('Đã huỷ', 'Liên kết đã được gỡ.');
      await fetchAll();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể huỷ liên kết.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewProgress = async (linkId: string, period: 'weekly' | 'monthly') => {
    if (!authHeader) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/parent-student-links/my-children/${linkId}/progress?period=${period}`,
        { headers: authHeader }
      );
      if (!res.ok) {
        const t = await readErrorText(res);
        throw new Error(t || 'Không thể tải báo cáo tiến độ.');
      }
      const raw: any = await res.json();
      const data: ChildProgress = raw?.data ?? raw;
      setProgress(data);
      setProgressLinkId(linkId);
      setProgressPeriod(period);
    } catch (e: any) {
      console.error('[PARENT_LINK] viewProgress error:', e);
      Alert.alert('Lỗi', e?.message ?? 'Không thể tải báo cáo.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendReportEmail = async () => {
    if (!authHeader || !progressLinkId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parent-student-links/send-report`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: progressLinkId, period: progressPeriod }),
      });
      if (!res.ok) {
        const t = await readErrorText(res);
        throw new Error(t || 'Không thể gửi email báo cáo.');
      }
      Alert.alert('Đã gửi', 'Báo cáo đã được gửi qua email (nếu cấu hình backend hỗ trợ).');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể gửi email báo cáo.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpiry = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Kết nối Phụ huynh</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isStudent && !isParent && (
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tài khoản không hỗ trợ</Text>
            <Text style={[styles.cardText, { color: colors.secondaryText }]}>
              Flow này dành cho role STUDENT (tạo mã) và PARENT (nhập mã).
            </Text>
          </View>
        )}

        {isStudent && (
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Bước 1 — Tạo mã kết nối</Text>
            <Text style={[styles.cardText, { color: colors.secondaryText }]}>
              Tạo mã 8 ký tự, có hạn 24 giờ. Gửi mã này cho phụ huynh để họ nhập và kết nối.
            </Text>

            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="call-outline" size={18} color={colors.mutedText} />
              <TextInput
                style={[styles.input, { color: colors.text, letterSpacing: 0 }]}
                placeholder="SĐT phụ huynh (E.164) VD: +84901234567"
                placeholderTextColor={colors.mutedText}
                keyboardType="phone-pad"
                autoCapitalize="none"
                value={parentPhone}
                onChangeText={setParentPhone}
                editable={!isLoading}
              />
            </View>

            <View style={styles.channelRow}>
              <TouchableOpacity
                style={[styles.channelChip, sendChannel === 'zalo' && styles.channelChipActive]}
                onPress={() => setSendChannel('zalo')}
                disabled={isLoading}
              >
                <Text style={[styles.channelChipText, sendChannel === 'zalo' && styles.channelChipTextActive]}>
                  Zalo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.channelChip, sendChannel === 'sms' && styles.channelChipActive]}
                onPress={() => setSendChannel('sms')}
                disabled={isLoading}
              >
                <Text style={[styles.channelChipText, sendChannel === 'sms' && styles.channelChipTextActive]}>
                  SMS
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => void generateCode()} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="key-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Tạo / Lấy mã</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => void sendCode()} disabled={isLoading}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Gửi mã qua Zalo/SMS</Text>
            </TouchableOpacity>

            {!!linkCode && (
              <View style={[styles.codeBox, { borderColor: colors.border }]}>
                <Text style={[styles.codeLabel, { color: colors.mutedText }]}>Mã kết nối</Text>
                <Text style={[styles.codeValue, { color: colors.text }]}>{linkCode.linkCode}</Text>
                <Text style={[styles.codeHint, { color: colors.secondaryText }]}>
                  Hết hạn: {formatExpiry(linkCode.expiresAt)}
                </Text>
              </View>
            )}
          </View>
        )}

        {isParent && (
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Bước 2 — Nhập mã để kết nối</Text>
            <Text style={[styles.cardText, { color: colors.secondaryText }]}>
              Nhập mã 8 ký tự từ học sinh. Mã hợp lệ sẽ tạo liên kết phụ huynh–học sinh.
            </Text>

            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="ticket-outline" size={18} color={colors.mutedText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="VD: A3BX7K2M"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="characters"
                value={connectCode}
                onChangeText={setConnectCode}
                editable={!isLoading}
                maxLength={8}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => void connectByCode()} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="link-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Kết nối</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isStudent && (
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Liên kết của tôi</Text>
            <Text style={[styles.cardText, { color: colors.secondaryText }]}>
              Danh sách phụ huynh đã liên kết với tài khoản học sinh của bạn.
            </Text>

            {myParents.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Chưa có phụ huynh liên kết.</Text>
            ) : (
              myParents.map((p) => (
                <View key={p.linkId} style={[styles.listItem, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                      {p.fullName}
                    </Text>
                    {!!p.phoneNumber && (
                      <Text style={[styles.listSub, { color: colors.secondaryText }]} numberOfLines={1}>
                        {p.phoneNumber}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Xác nhận', 'Bạn có chắc muốn gỡ liên kết này?', [
                        { text: 'Huỷ', style: 'cancel' },
                        { text: 'Gỡ', style: 'destructive', onPress: () => void revokeLinkAsParent(p.linkId) },
                      ])
                    }
                    style={styles.dangerBtn}
                    disabled={isLoading}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {isParent && (
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Con của tôi</Text>
            <Text style={[styles.cardText, { color: colors.secondaryText }]}>
              Danh sách học sinh đã liên kết. Bạn có thể xem báo cáo tuần/tháng.
            </Text>

            {myChildren.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Chưa có học sinh liên kết.</Text>
            ) : (
              myChildren.map((c) => (
                <View key={c.linkId} style={[styles.listItem, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                      {c.fullName}
                    </Text>
                    <Text style={[styles.listSub, { color: colors.secondaryText }]} numberOfLines={1}>
                      Lớp {c.gradeLevel ?? '-'} • Streak {c.currentStreak ?? 0} • XP {c.xpTotal ?? 0}
                    </Text>
                  </View>
                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => void viewProgress(c.linkId, 'weekly')}
                      disabled={isLoading}
                    >
                      <Text style={styles.smallBtnText}>Tuần</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => void viewProgress(c.linkId, 'monthly')}
                      disabled={isLoading}
                    >
                      <Text style={styles.smallBtnText}>Tháng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Xác nhận', 'Bạn có chắc muốn gỡ liên kết này?', [
                          { text: 'Huỷ', style: 'cancel' },
                          { text: 'Gỡ', style: 'destructive', onPress: () => void revokeLinkAsStudent(c.linkId) },
                        ])
                      }
                      style={styles.dangerBtn}
                      disabled={isLoading}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {!!progress && (
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Báo cáo {progressPeriod === 'weekly' ? 'tuần' : 'tháng'} — {progress.fullName}
            </Text>
            {!!progress.highlightText && (
              <Text style={[styles.cardText, { color: colors.secondaryText }]}>{progress.highlightText}</Text>
            )}

            <View style={styles.kpiRow}>
              <View style={[styles.kpi, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Lessons</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>
                  {progress.lessonsCompleted ?? 0}/{progress.lessonsStarted ?? 0}
                </Text>
              </View>
              <View style={[styles.kpi, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Watch</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>{progress.totalWatchMinutes ?? 0}m</Text>
              </View>
              <View style={[styles.kpi, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Avg Quiz</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>{progress.avgQuizScore ?? 0}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => void sendReportEmail()} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Gửi báo cáo qua email</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setProgress(null)} disabled={isLoading}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Đóng báo cáo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 18, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cardText: { fontSize: 13, lineHeight: 18 },
  emptyText: { marginTop: 10, fontSize: 13 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
  codeBox: { marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  codeLabel: { fontSize: 11, fontWeight: '800' },
  codeValue: { marginTop: 6, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  codeHint: { marginTop: 6, fontSize: 12 },
  inputRow: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  channelRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  channelChip: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  channelChipActive: {
    backgroundColor: '#111827',
  },
  channelChipText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },
  channelChipTextActive: {
    color: '#fff',
  },
  listItem: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listTitle: { fontSize: 14, fontWeight: '800' },
  listSub: { marginTop: 2, fontSize: 12 },
  actionsCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  dangerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  kpiRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  kpi: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12 },
  kpiLabel: { fontSize: 11, fontWeight: '800' },
  kpiValue: { marginTop: 6, fontSize: 16, fontWeight: '900' },
});

