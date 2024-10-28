use std::env;

use actix_identity::Identity;
use actix_web::{get, post, web, HttpMessage, HttpRequest, HttpResponse, Responder};
use lettre::{
    message::Mailbox, transport::smtp::authentication::Credentials, Message, SmtpTransport,
    Transport,
};
use rand::distributions::{Alphanumeric, DistString};
use serde::Deserialize;
use serde_json::json;

use crate::{
    db::MainDbPooledConnection,
    error::{AppError, AppResult},
};

async fn send_mail(send_to: &str, title: &str, text: &str) -> AppResult<()> {
    let site_name = env::var("SITE_NAME").unwrap_or("ComicSeeder".into());
    let mailaddr_from = env::var("SMTP_MAILADDR")?;
    let smtp_encryption = env::var("SMTP_ENCRYPTION")?;
    let smtp_host = env::var("SMTP_HOST")?;

    let email = Message::builder()
        .header(lettre::message::header::ContentType::TEXT_PLAIN)
        .from(mailaddr_from.parse()?)
        .to(Mailbox::new(None, send_to.parse()?))
        .subject(format!("{}: {}", site_name, title))
        .body(text.to_string())?;

    let mut mailer = match smtp_encryption.as_str() {
        "starttls" => SmtpTransport::starttls_relay(&smtp_host).unwrap(),
        "tls" => SmtpTransport::relay(&smtp_host).unwrap(),
        "plain" => SmtpTransport::builder_dangerous(&smtp_host),
        x => {
            panic!("invalid SMTP_ENCRYPTION value: {}", x);
        }
    };

    if let Ok(smtp_port) = env::var("SMTP_PORT") {
        mailer = mailer.port(smtp_port.parse()?);
    }
    if let (Ok(smtp_user), Ok(smtp_password)) = (env::var("SMTP_USER"), env::var("SMTP_PASSWORD")) {
        let cred = Credentials::new(smtp_user, smtp_password);
        mailer = mailer.credentials(cred);
    }

    let mailer = mailer.build();

    mailer.send(&email)?;

    Ok(())
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[post("/login")]
pub async fn login(
    request: HttpRequest,
    db: web::Data<MainDbPooledConnection>,
    login_data: web::Json<LoginRequest>,
) -> AppResult<impl Responder> {
    let LoginRequest { email, password } = login_data.0;

    let hash: Result<String, sqlx::Error> =
        sqlx::query_scalar("SELECT password_hash FROM users WHERE email = $1;")
            .bind(&email)
            .fetch_one(db.get_ref())
            .await;

    let hash = if let Ok(x) = hash {
        x
    } else {
        return Err(AppError::AuthErr("login failed".to_string()));
    };

    if let Ok(true) = bcrypt::verify(password, &hash) {
        Identity::login(&request.extensions(), email.into()).unwrap();
        Ok(HttpResponse::Ok().json(json! {
            {
                "message": "successfully logged in"
            }
        }))
    } else {
        return Err(AppError::AuthErr("login failed".to_string()));
    }
}

#[get("/logout")]
pub async fn logout(user: Identity) -> impl Responder {
    user.logout();
    HttpResponse::Ok().json(json! {
        {
            "message": "successfully logged out"
        }
    })
}

#[derive(Deserialize)]
struct SignupRequest {
    email: String,
    password: String,
}

async fn send_verification_main(email: &str, token: &str) -> AppResult<()> {
    let site_url = env::var("FRONT_ORIGIN")?;
    let verification_url = format!("{}/verification?{}", site_url, token);

    send_mail(
        email,
        "ユーザー登録の確認",
        format!(
            "登録を完了するためには10分以内に以下のURLにアクセスしてください。\n\
            {}\n\
            このメールに心当たりがない場合は破棄して頂くようお願いします。",
            verification_url
        )
        .as_str(),
    )
    .await
}

#[post("/signup")]
pub async fn signup(
    request: HttpRequest,
    db: web::Data<MainDbPooledConnection>,
    login_data: web::Json<SignupRequest>,
) -> AppResult<impl Responder> {
    let SignupRequest { email, password } = login_data.0;

    let hash = bcrypt::hash(&password, 8)?;

    let mut rng = rand::thread_rng();
    let random_code = Alphanumeric.sample_string(&mut rng, 32);
    let now_time = chrono::Utc::now().timestamp();

    let verification_token = format!("{}_{}", random_code, now_time);

    sqlx::query(
        "INSERT INTO users (email, password_hash, verification_token) VALUES ($1, $2, $3);",
    )
    .bind(&email)
    .bind(&hash)
    .bind(&verification_token)
    .execute(db.as_ref())
    .await?;

    send_verification_main(&email, &verification_token).await?;

    Identity::login(&request.extensions(), email.into()).unwrap();
    Ok(HttpResponse::Ok().json(json! {
        {
            "message": "temporary user successfully registered"
        }
    }))
}

async fn verify_verification_token(
    token: &str,
    email_from_session: &str,
    db: &MainDbPooledConnection,
) -> bool {
    let Some((_, token_timestamp)) = token.split_once('_') else {
        return false;
    };
    let Ok(token_timestamp) = token_timestamp.parse::<i64>() else {
        return false;
    };

    if chrono::Utc::now().timestamp() > token_timestamp + 600 {
        return false;
    }

    let Ok(email_from_token): Result<String, sqlx::Error> =
        sqlx::query_scalar("SELECT email FROM users WHERE verification_token = $1;")
            .bind(token)
            .fetch_one(db)
            .await
    else {
        return false;
    };

    email_from_token == email_from_session
}

#[get("/verification")]
pub async fn verification(
    request: HttpRequest,
    db: web::Data<MainDbPooledConnection>,
    identity: Option<Identity>,
) -> AppResult<impl Responder> {
    let identity = identity.ok_or(AppError::AuthErr("not logined".to_string()))?;
    let email_from_session = identity.id()?;

    let verification_token = request.query_string();

    if !verify_verification_token(verification_token, &email_from_session, db.as_ref()).await {
        return Err(AppError::AuthErr("invalid token".to_string()));
    }

    sqlx::query("UPDATE users SET verification_token = NULL WHERE verification_token = $1;")
        .bind(&verification_token)
        .execute(db.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(json! {
        {
            "message": "user verified"
        }
    }))
}

#[derive(Deserialize)]
struct PasswordResetTryRequest {
    email: String,
}

async fn send_password_reset_mail(email: &str, token: &str) -> AppResult<()> {
    let site_url = env::var("FRONT_ORIGIN")?;
    let verification_url = format!("{}/password_reset?{}", site_url, token);

    send_mail(
        email,
        "パスワードリセット",
        format!(
            "パスワードリセットを行うためには10分以内に以下のURLにアクセスしてください。\n\
            {}\n\
            このメールに心当たりがない場合は破棄して頂くようお願いします。",
            verification_url
        )
        .as_str(),
    )
    .await
}

#[post("/password_reset_try")]
pub async fn password_reset_try(
    db: web::Data<MainDbPooledConnection>,
    password_reset_data: web::Json<PasswordResetTryRequest>,
) -> AppResult<impl Responder> {
    let mut rng = rand::thread_rng();
    let random_code = Alphanumeric.sample_string(&mut rng, 32);
    let now_time = chrono::Utc::now().timestamp();

    let password_reset_token = format!("{}_{}", random_code, now_time);

    sqlx::query("UPDATE users SET password_reset_token = $1 WHERE email = $2;")
        .bind(&password_reset_token)
        .bind(&password_reset_data.email)
        .execute(db.as_ref())
        .await?;

    send_password_reset_mail(&password_reset_data.email, &password_reset_token).await?;

    Ok(HttpResponse::Ok().json(json! {
        {
            "message": "check mail was sent"
        }
    }))
}

async fn verify_password_reset_token(token: &str, db: &MainDbPooledConnection) -> bool {
    let Some((_, token_timestamp)) = token.split_once('_') else {
        return false;
    };
    let Ok(token_timestamp) = token_timestamp.parse::<i64>() else {
        return false;
    };

    if chrono::Utc::now().timestamp() > token_timestamp + 600 {
        return false;
    }

    let email: Result<String, sqlx::Error> =
        sqlx::query_scalar("SELECT email FROM users WHERE password_reset_token = $1;")
            .bind(token)
            .fetch_one(db)
            .await;

    email.is_ok()
}

#[get("/password_reset")]
pub async fn password_reset_verification(
    request: HttpRequest,
    db: web::Data<MainDbPooledConnection>,
) -> AppResult<impl Responder> {
    if !verify_password_reset_token(request.query_string(), db.as_ref()).await {
        return Err(AppError::AuthErr("invalid token".to_string()));
    }

    Ok(HttpResponse::Ok().json(json! {
        {
            "message": "token is valid"
        }
    }))
}

#[derive(Deserialize)]
struct PasswordResetRequest {
    password_reset_token: String,
    password: String,
}

#[post("/password_reset")]
pub async fn password_reset(
    db: web::Data<MainDbPooledConnection>,
    reset_data: web::Json<PasswordResetRequest>,
) -> AppResult<impl Responder> {
    if !verify_password_reset_token(&reset_data.password_reset_token, db.as_ref()).await {
        return Err(AppError::AuthErr("invalid token".to_string()));
    }

    sqlx::query("UPDATE users SET password_hash = $1, password_reset_token = NULL WHERE password_reset_token = $2;")
        .bind(bcrypt::hash(&reset_data.password, 8)?)
        .bind(&reset_data.password_reset_token)
        .execute(db.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(json! {
        {
            "message": "new password was successfully set"
        }
    }))
}
