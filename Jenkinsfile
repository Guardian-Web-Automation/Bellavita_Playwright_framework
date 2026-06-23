pipeline {
    agent any

    tools {
        nodejs 'NodeJS'   // must match the name in Jenkins → Global Tool Configuration
    }

    environment {
        CI = 'true'
    }

    stages {

        stage('Cleanup Workspace') {
            steps { cleanWs() }
        }

        stage('Clone Repo') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/Guardian-Web-Automation/Bellavita_Playwright_framework.git'
            }
        }

        stage('Install Dependencies') {
            steps { bat 'npm ci' }
        }

        stage('Install Playwright Browsers') {
            steps { bat 'npx playwright install chromium --with-deps' }
        }

        stage('Run Playwright Tests') {
            steps {
                withCredentials([
                    string(credentialsId: 'TEST_PHONE_NUMBER',   variable: 'TEST_PHONE_NUMBER'),
                    string(credentialsId: 'GMAIL_CLIENT_ID',     variable: 'GMAIL_CLIENT_ID'),
                    string(credentialsId: 'GMAIL_CLIENT_SECRET', variable: 'GMAIL_CLIENT_SECRET'),
                    string(credentialsId: 'GMAIL_REFRESH_TOKEN', variable: 'GMAIL_REFRESH_TOKEN')
                ]) {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        bat 'npx playwright test --grep "@smoke" --project=mobile-chrome'
                    }
                }
            }
        }

        stage('Publish Results') {
            steps {
                // Parse JUnit XML so Jenkins shows pass/fail counts on the build page
                junit testResults: 'playwright-report/results.xml', allowEmptyResults: true

                // Archive the Playwright HTML report (accessible from build sidebar)
                publishHTML([
                    allowMissing:          true,
                    alwaysLinkToLastBuild: true,
                    keepAll:               true,
                    reportDir:             'playwright-report',
                    reportFiles:           'index.html',
                    reportName:            'Playwright-Report'
                ])
            }
        }
    }

    // ─── Email report sent after every run (pass or fail) ───────────────────
    post {
        always {
            script {
                def buildResult = currentBuild.result ?: 'SUCCESS'
                def isPassed    = (buildResult == 'SUCCESS')

                // ── Aggregate counts from JUnit plugin ──────────────────────
                def totalTests   = currentBuild.testResultAction?.totalCount ?: 0
                def failedTests  = currentBuild.testResultAction?.failCount  ?: 0
                def skippedTests = currentBuild.testResultAction?.skipCount  ?: 0
                def passedTests  = totalTests - failedTests - skippedTests

                // ── Visual style ────────────────────────────────────────────
                def statusColor = isPassed ? '#27AE60' : '#E74C3C'
                def statusBg    = isPassed ? '#eafaf1' : '#fdedec'
                def statusText  = isPassed ? 'ALL TESTS PASSED' : 'TESTS FAILED'
                def statusEmoji = isPassed ? '✅' : '❌'

                def failBg      = failedTests > 0 ? '#fdedec' : '#f5f5f5'
                def failColor   = failedTests > 0 ? '#E74C3C' : '#aaa'

                // ── Per-test rows via PowerShell XML parse ──────────────────
                def testRows = '<tr><td colspan="2" style="padding:10px;color:#aaa;font-size:13px;">Test details unavailable.</td></tr>'
                try {
                    // Write a small PS1 to avoid quoting nightmares in bat
                    writeFile file: '_parse_results.ps1', text: '''
$ErrorActionPreference = "SilentlyContinue"
$xml = [xml](Get-Content "playwright-report\\results.xml" -Encoding UTF8)
foreach ($tc in $xml.SelectNodes("//testcase")) {
    $s = if ($tc.failure -ne $null) { "F" } else { "P" }
    $n = ($tc.name -replace "^@smoke\\s+", "").Trim()
    Write-Output "$s|||$n"
}
'''
                    def raw   = bat(script: '@powershell -NoProfile -File _parse_results.ps1', returnStdout: true).trim()
                    def rows  = ''
                    raw.split('\r?\n').each { line ->
                        line = line.trim()
                        if (line ==~ /^[PF]\|\|\|.*/) {
                            def parts = line.split('\\|\\|\\|', 2)
                            def st    = parts[0]
                            def name  = parts.size() > 1 ? parts[1] : ''
                            def icon  = (st == 'P') ? '&#10003;' : '&#10007;'
                            def fg    = (st == 'P') ? '#27AE60'  : '#E74C3C'
                            def rowBg = (st == 'P') ? '#f9f9f9'  : '#fff5f5'
                            rows += """<tr style="background:${rowBg};">
  <td style="padding:9px 6px;width:28px;text-align:center;font-size:15px;font-weight:bold;color:${fg};">${icon}</td>
  <td style="padding:9px 8px;font-size:13px;color:#333;">${name}</td>
</tr>"""
                        }
                    }
                    if (rows) testRows = rows
                } catch (ignored) { /* keep the default "unavailable" row */ }

                def duration   = currentBuild.durationString.replace(' and counting', '')
                def reportLink = "${env.BUILD_URL}Playwright-Report/"
                def buildLink  = env.BUILD_URL

                // ── HTML email body ─────────────────────────────────────────
                def body = """<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background:#eeeeee;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.14);">

  <!-- Header -->
  <div style="background:#1a1a2e;padding:20px 26px;">
    <h1 style="margin:0;color:#ffffff;font-size:17px;letter-spacing:1px;">BELLAVITA ORGANIC</h1>
    <p style="margin:4px 0 0;color:#9999bb;font-size:11px;letter-spacing:0.5px;">PLAYWRIGHT AUTOMATED TEST REPORT</p>
  </div>

  <!-- Status banner -->
  <div style="background:${statusBg};padding:22px;text-align:center;border-left:6px solid ${statusColor};">
    <div style="font-size:40px;line-height:1;">${statusEmoji}</div>
    <div style="font-size:20px;font-weight:bold;color:${statusColor};margin-top:8px;">${statusText}</div>
    <div style="font-size:12px;color:#777;margin-top:5px;">Build #${env.BUILD_NUMBER} &nbsp;&middot;&nbsp; ${duration}</div>
  </div>

  <!-- Counts -->
  <div style="padding:18px 26px;border-bottom:1px solid #eeeeee;">
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tr>
        <td style="text-align:center;padding:14px 6px;background:#f5f5f5;border-radius:6px;">
          <div style="font-size:26px;font-weight:bold;color:#333;">${totalTests}</div>
          <div style="font-size:10px;color:#888;margin-top:3px;letter-spacing:1px;">TOTAL</div>
        </td>
        <td style="width:10px;"></td>
        <td style="text-align:center;padding:14px 6px;background:#eafaf1;border-radius:6px;">
          <div style="font-size:26px;font-weight:bold;color:#27AE60;">${passedTests}</div>
          <div style="font-size:10px;color:#27AE60;margin-top:3px;letter-spacing:1px;">PASSED</div>
        </td>
        <td style="width:10px;"></td>
        <td style="text-align:center;padding:14px 6px;background:${failBg};border-radius:6px;">
          <div style="font-size:26px;font-weight:bold;color:${failColor};">${failedTests}</div>
          <div style="font-size:10px;color:${failColor};margin-top:3px;letter-spacing:1px;">FAILED</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Build info -->
  <div style="padding:14px 26px;background:#fafafa;border-bottom:1px solid #eeeeee;font-size:13px;color:#555;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:4px 0;width:110px;">Suite</td>     <td style="padding:4px 0;font-weight:600;color:#333;">Smoke Tests (@smoke)</td></tr>
      <tr><td style="padding:4px 0;">Device</td>    <td style="padding:4px 0;font-weight:600;color:#333;">iPhone 14 Pro &ndash; Mobile Chrome</td></tr>
      <tr><td style="padding:4px 0;">Branch</td>    <td style="padding:4px 0;font-weight:600;color:#333;">main</td></tr>
      <tr><td style="padding:4px 0;">Duration</td>  <td style="padding:4px 0;font-weight:600;color:#333;">${duration}</td></tr>
    </table>
  </div>

  <!-- Per-test results -->
  <div style="padding:14px 26px;border-bottom:1px solid #eeeeee;">
    <div style="font-size:10px;color:#aaa;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">Test Results</div>
    <table style="width:100%;border-collapse:collapse;border-radius:4px;overflow:hidden;">
      ${testRows}
    </table>
  </div>

  <!-- Action buttons -->
  <div style="padding:18px 26px;text-align:center;">
    <a href="${reportLink}" style="display:inline-block;margin:4px;padding:10px 22px;background:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:5px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">&#128196; HTML REPORT</a>
    <a href="${buildLink}"  style="display:inline-block;margin:4px;padding:10px 22px;background:#555555;color:#ffffff;text-decoration:none;border-radius:5px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">&#128279; JENKINS BUILD</a>
  </div>

  <!-- Footer -->
  <div style="padding:12px 26px;background:#f8f8f8;border-top:1px solid #eeeeee;text-align:center;">
    <p style="margin:0;font-size:10px;color:#bbb;letter-spacing:0.5px;">GUARDIAN WEB AUTOMATION &nbsp;|&nbsp; BELLAVITA ORGANIC &nbsp;|&nbsp; BUILD #${env.BUILD_NUMBER}</p>
  </div>

</div>
</body>
</html>"""

                emailext(
                    to:       'gauravrana7354@gmail.com, gourav.kumar@oneguardian.in',
                    subject:  "${statusEmoji} [${buildResult}] Bellavita Smoke — Build #${env.BUILD_NUMBER} | ${passedTests}/${totalTests} Passed",
                    mimeType: 'text/html',
                    body:     body
                )
            }
        }
    }
}
