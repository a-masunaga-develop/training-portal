========================================
研修ポータル MVP
README.txt
========================================

■ 概要

研修ポータルのMVP（Minimum Viable Product）をローカル環境で構築する。

まずはAWSへデプロイせず、ローカル環境のみで以下の機能を完成させる。

・ダッシュボード
・Phase1学習画面
・テスト機能
・日報機能
・管理画面

AI機能や認証機能は後工程とする。

========================================
MVPゴール
========================================

受講者向け

・ダッシュボード閲覧
・Phase1学習コンテンツ閲覧
・テスト受験
・日報登録
・学習履歴確認

管理者向け

・受講者一覧確認
・進捗確認
・日報確認
・テスト結果確認

========================================
技術スタック
========================================

フロントエンド

・Next.js 15
・React
・TypeScript
・Tailwind CSS
・shadcn/ui

開発環境

・Docker
・DynamoDB Local
・LocalStack
・Claude Code

将来採用予定

・AWS CloudFront
・AWS WAF
・API Gateway
・Lambda
・DynamoDB
・Cognito
・S3
・Claude API

========================================
ローカルアーキテクチャ
========================================

Browser
↓
Next.js
↓
Route Handler
↓
DynamoDB Local

========================================
本番アーキテクチャ（将来）
========================================

Internet
↓
CloudFront
↓
WAF
↓
API Gateway
↓
Lambda
↓
DynamoDB

========================================
ディレクトリ構成
========================================

training-portal
├─ docker-compose.yml
├─ README.txt
│
├─ frontend
│   ├─ src
│   ├─ app
│   ├─ components
│   ├─ lib
│   └─ api
│
└─ infrastructure
    └─ dynamodb
        ├─ tables
        │   ├─ users.json
        │   ├─ reports.json
        │   ├─ tests.json
        │   ├─ progress.json
        │   └─ test_results.json
        │
        ├─ seed
        │   ├─ users.json
        │   ├─ tests.json
        │   └─ progress.json
        │
        ├─ init.sh
        └─ seed.sh

========================================
Docker Compose
========================================

docker-compose.yml

services:

  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    command: "-jar DynamoDBLocal.jar -sharedDb"
    ports:
      - "8000:8000"

  localstack:
    image: localstack/localstack:latest
    container_name: localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3

========================================
起動
========================================

docker compose up -d

========================================
停止
========================================

docker compose down

========================================
接続先
========================================

Next.js

http://localhost:3000

DynamoDB Local

http://localhost:8000

LocalStack

http://localhost:4566

========================================
環境変数
========================================

.env.local

APP_ENV=local

AWS_REGION=ap-northeast-1

DYNAMODB_ENDPOINT=http://localhost:8000

LOCALSTACK_ENDPOINT=http://localhost:4566

AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

========================================
画面構成
========================================

1. ダッシュボード

・学習進捗率
・未受験テスト
・未提出日報
・お知らせ

2. Phase1

・クラウドとは
・IAM
・S3
・EC2

3. テスト

・問題表示
・回答
・採点

4. 日報

・学習日
・学習時間
・学習内容
・理解度
・コメント

5. 管理画面

・受講者一覧
・進捗率
・日報一覧
・テスト結果

========================================
DynamoDBテーブル
========================================

users

用途：
受講者管理

主キー：
userId

----------------------------

reports

用途：
日報管理

主キー：
reportId

----------------------------

tests

用途：
テスト管理

主キー：
testId

----------------------------

progress

用途：
学習進捗管理

主キー：
userId

----------------------------

test_results

用途：
テスト結果管理

主キー：
resultId

========================================
サンプルデータ
========================================

users

{
  "userId": "u001",
  "name": "山田太郎",
  "role": "student"
}

---------------------------------

progress

{
  "userId": "u001",
  "phase": "phase1",
  "completed": 30
}

---------------------------------

tests

{
  "testId": "t001",
  "phase": "phase1",
  "question": "IAMとは何ですか？"
}

========================================
init.sh
========================================

役割

・tables配下のJSON読込
・テーブル作成
・存在時スキップ

実行

./infrastructure/dynamodb/init.sh

========================================
seed.sh
========================================

役割

・seed配下のJSON読込
・初期データ登録

実行

./infrastructure/dynamodb/seed.sh

========================================
開発ステップ
========================================

Step1

環境構築

・Docker
・Next.js
・DynamoDB Local
・LocalStack

---------------------------------

Step2

UI作成

・Dashboard
・Phase1
・Test
・Report
・Admin

---------------------------------

Step3

DynamoDB接続

作成テーブル

・users
・reports
・tests
・progress
・test_results

---------------------------------

Step4

日報機能

・登録
・一覧表示

---------------------------------

Step5

テスト機能

・問題表示
・回答
・採点

---------------------------------

Step6

管理画面

・受講者表示
・進捗表示
・日報表示
・テスト結果表示

========================================
Git運用
========================================

main

本番相当

develop

開発統合

feature/dashboard
feature/report
feature/test
feature/admin

========================================
MVP完了条件
========================================

□ Phase1学習コンテンツ表示

□ 日報登録

□ 日報一覧表示

□ テスト受験

□ テスト採点

□ 進捗表示

□ 管理画面表示

□ DynamoDB Local保存

========================================
フェーズ2
========================================

認証

・Cognito

ストレージ

・S3
・動画管理

AI

・Claude API
・日報分析
・テスト自動生成
・ロードマップ生成

AWS

・CloudFront
・WAF
・API Gateway
・Lambda

CI/CD

・GitHub Actions

========================================
最終目標
========================================

共通基盤を構築する。

対象システム

・研修ポータル
・社員情報管理システム
・スキル管理システム
・案件アサイン管理システム

共通技術基盤

・Next.js
・TypeScript
・DynamoDB
・AWS
・Claude API
・Cognito