use std::env;

use actix_identity::Identity;
use actix_web::{get, post, web, HttpMessage, HttpRequest, HttpResponse, Responder};
use lettre::{
    message::Mailbox, transport::smtp::authentication::Credentials, Message, SmtpTransport, Transport,
};
use serde::Deserialize;
use serde_json::json;

use crate::{
    db::MainDbPooledConnection,
    error::{AppError, AppResult},
};

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
    let site_name = env::var("SITE_NAME").unwrap_or("ComicSeeder".into());
    let mailaddr_from = env::var("SMTP_MAILADDR")?;
    let site_url = env::var("FRONT_ORIGIN")?;
    let smtp_encryption = env::var("SMTP_ENCRYPTION")?;
    let smtp_host = env::var("SMTP_HOST")?;

    let verification_url = format!("{}/api/v1/verification?{}", site_url, token);

    let email = Message::builder()
        .header(lettre::message::header::ContentType::TEXT_PLAIN)
        .from(mailaddr_from.parse()?)
        .to(Mailbox::new(None, email.parse()?))
        .subject(format!("{}: ユーザー登録の確認", site_name))
        .body(format!(
            "登録を完了するためには10分以内に以下のURLにアクセスしてください。\n\
            {}\n\
            このメールに心当たりがない場合は破棄して頂くようお願いします。",
            verification_url
        ))?;

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

#[post("/signup")]
pub async fn signup(
    db: web::Data<MainDbPooledConnection>,
    login_data: web::Json<SignupRequest>,
) -> AppResult<impl Responder> {
    let SignupRequest { email, password } = login_data.0;

    let hash = bcrypt::hash(&password, 8)?;
    let verification_token = ""; // TODO

    sqlx::query(
        "INSERT INTO users (email, password_hash, verification_token) VALUES ($1, $2, $3);",
    )
    .bind(&email)
    .bind(hash)
    .bind(verification_token)
    .execute(db.get_ref())
    .await?;

    send_verification_main(&email, &verification_token).await?;

    Ok(HttpResponse::Ok().json(json! {
        {
            "message": "temporary user successfully registered"
        }
    }))
}

#[get("/verification")]
pub async fn verification() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}
