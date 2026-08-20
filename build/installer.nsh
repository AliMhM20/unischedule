!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; ==========================================
; INSTALLER SPECIFIC CODE
; ==========================================
!ifndef BUILD_UNINSTALLER
  Var DialogDesktop
  Var HwndDesktopCheck
  Var CreateDesktopCheckState
  Var SkipDesktopShortcut

  Function OptionsPageCreate
    nsDialogs::Create 1018
    Pop $DialogDesktop
    ${If} $DialogDesktop == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0 0 100% 20u "تنظیمات میانبر دسکتاپ:"
    Pop $0

    ${NSD_CreateCheckbox} 10u 30u 90% 15u "ایجاد آیکون و میانبر روی دسکتاپ (Create Desktop Shortcut)"
    Pop $HwndDesktopCheck

    ; Default to checked (1)
    ${NSD_SetState} $HwndDesktopCheck 1

    nsDialogs::Show
  FunctionEnd

  Function OptionsPageLeave
    ${NSD_GetState} $HwndDesktopCheck $CreateDesktopCheckState
    ${If} $CreateDesktopCheckState == 0
      StrCpy $SkipDesktopShortcut "true"
    ${Else}
      StrCpy $SkipDesktopShortcut "false"
    ${EndIf}
  FunctionEnd

  !macro customPageAfterChangeDir
    Page custom OptionsPageCreate OptionsPageLeave
  !macroend

  !macro customInstall
    ${If} $SkipDesktopShortcut == "true"
      Delete "$DESKTOP\UniSchedule.lnk"
    ${EndIf}
  !macroend

  ; Non-blocking instant launch without freezing UI
  Function StartAppAsync
    HideWindow
    ExecShell "open" "$INSTDIR\UniSchedule.exe"
  FunctionEnd

  !macro customFinishPage
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartAppAsync"
    !insertmacro MUI_PAGE_FINISH
  !macroend
!endif

; ==========================================
; UNINSTALLER SPECIFIC CODE
; ==========================================
!ifdef BUILD_UNINSTALLER
  Var DialogUninst
  Var HwndDeleteDataCheck
  Var DeleteAppDataChecked

  Function un.UninstOptionsPageCreate
    nsDialogs::Create 1018
    Pop $DialogUninst
    ${If} $DialogUninst == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0 0 100% 24u "گزینه‌های پاکسازی داده‌های برنامه:"
    Pop $0

    ${NSD_CreateCheckbox} 10u 35u 90% 20u "حذف کامل حافظه پنهان و برنامه‌های انتخاب واحد ذخیره‌شده (Clear App Data & Cache)"
    Pop $HwndDeleteDataCheck

    ; Default to unchecked (0)
    ${NSD_SetState} $HwndDeleteDataCheck 0

    nsDialogs::Show
  FunctionEnd

  Function un.UninstOptionsPageLeave
    ${NSD_GetState} $HwndDeleteDataCheck $DeleteAppDataChecked
  FunctionEnd

  ; Display the options page BEFORE file removal
  !macro customUnWelcomePage
    !insertmacro MUI_UNPAGE_WELCOME
    UninstPage custom un.UninstOptionsPageCreate un.UninstOptionsPageLeave
  !macroend

  !macro customUnInstall
    ${If} $DeleteAppDataChecked == 1
      SetShellVarContext current
      RMDir /r "$APPDATA\UniSchedule"
      RMDir /r "$LOCALAPPDATA\UniSchedule"
      RMDir /r "$LOCALAPPDATA\unischedule-updater"
      RMDir /r "$APPDATA\react-example"
      RMDir /r "$LOCALAPPDATA\react-example"
      RMDir /r "$LOCALAPPDATA\react-example-updater"
      RMDir /r "$APPDATA\unischedule"
      RMDir /r "$LOCALAPPDATA\unischedule"
    ${EndIf}
  !macroend
!endif
