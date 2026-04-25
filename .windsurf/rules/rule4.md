# Windsurf Progress Tracking Rule
rule_name: "auto_update_progress_after_task"
condition: "after_completing_any_task_or_feature"
action: |
  "بعد الانتهاء من أي مهمة برمجية (Task) أو تعديل في الكود، يجب عليك فوراً:
  1. فتح ملف PROGRESS.md.
  2. تحديث قسم 'تم إنجازه' (Completed) بالمهمة الجديدة مع كتابة التاريخ والـ Commit Message المتعلق بها.
  3. تحديث الإحصائيات (Stats) ونسبة الإنجاز المئوية بناءً على المهام المتبقية.
  4. التأكد من أن حالة المرحلة (Phase Status) تعكس الواقع الحالي.
  5. لا تطلب من المستخدم تحديث الملف يدوياً، قم أنت بهذه المهمة كجزء من تقفيل الـ Task."