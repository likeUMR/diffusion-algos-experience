/**
 * 扩散模型严格等效算力约束 HPO 寻优历程历史数据
 * 包含每个 NFE、算法下各个 Trial 的超参数配置与倒角距离 (Chamfer Distance)
 */
const hpoHistoryData = {
  "100": {
    "consistency_models": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.41473657079041004,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 480
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 4.078466296195984,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 480
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 6.710761547088623,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 480
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 1.303098440170288,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 26
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 1.236009031534195,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 54
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 2.1415536403656006,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 406
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.45549844577908516,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 149
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 4.312692224979401,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 54
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 1.0831827819347382,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 753
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 1.3157815039157867,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 37
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.3711596019566059,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00530555630545886,
        "epochs": 480
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.6228585317730904,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.0035960166973952974,
        "weight_decay": 0.009651771273108692,
        "epochs": 480
      }
    ],
    "ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.1158975986763835,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.07372377719730139,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.06985842250287533,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.11913580261170864,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.10725513845682144,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.08627868350595236,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 1.4139603404328227,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.08022005390375853,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.007315649883821607,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.08529181405901909,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.01126836333423853,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.027645616326481104,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "ddpm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.10110437963157892,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.07567301206290722,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.07152268011122942,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.11391139961779118,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.1068044388666749,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.08529076538980007,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.10880405083298683,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.07940359506756067,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.007153482874855399,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.08925365563482046,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.012229074025526643,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.02809984888881445,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "flow_matching": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.08845015428960323,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.10204967577010393,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 3.0955664602423724e-05,
        "weight_decay": 1.2601639723276798e-07,
        "epochs": 115
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.08956464938819408,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 6.144543785587468e-05,
        "weight_decay": 1.5782327810795563e-06,
        "epochs": 93
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.011699193390086293,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.00043625993625605574,
        "weight_decay": 1.0547383621352015e-07,
        "epochs": 640
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.023682114202529192,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 0.0007026263205443051,
        "weight_decay": 4.374364439939069e-06,
        "epochs": 365
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.08789249416440725,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.056165640242397785,
        "hidden_dim": 256,
        "num_blocks": 6,
        "lr": 0.00041087915453240814,
        "weight_decay": 0.0033981724150106006,
        "epochs": 137
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.08024810906499624,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0017247957710046008,
        "weight_decay": 1.3820379228636985e-06,
        "epochs": 65
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.0771234454587102,
        "hidden_dim": 384,
        "num_blocks": 6,
        "lr": 0.0012141307774357361,
        "weight_decay": 1.5570196345516594e-07,
        "epochs": 61
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.06104720151051879,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 9.278723835524691e-05,
        "weight_decay": 4.9569479327999555e-08,
        "epochs": 640
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.01251140981912613,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.004137629314336305,
        "weight_decay": 1.281655346918598e-08,
        "epochs": 782
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.015506484312936664,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.004471095030947703,
        "weight_decay": 1.1769658897684507e-08,
        "epochs": 782
      }
    ],
    "mean_flow": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.1123077217489481,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 587
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.11586666759103537,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 1.498208643215546e-05,
        "weight_decay": 0.004935296209402108,
        "epochs": 89
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.11649546958506107,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 1.3245461546001868e-05,
        "weight_decay": 8.9532762476427e-07,
        "epochs": 1000
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.12396899983286858,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 6.907675985896193e-05,
        "weight_decay": 8.93511059033186e-07,
        "epochs": 341
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.09469516202807426,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 6.0538336093556843e-05,
        "weight_decay": 9.275294835907672e-08,
        "epochs": 1000
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.11154535599052906,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0002513045354320348,
        "weight_decay": 0.00016523945479957094,
        "epochs": 63
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.0901876175776124,
        "hidden_dim": 192,
        "num_blocks": 5,
        "lr": 0.0005127169631088556,
        "weight_decay": 1.63926099183277e-05,
        "epochs": 276
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.11348130367696285,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.0002688506084952372,
        "weight_decay": 2.8256199318003875e-07,
        "epochs": 728
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.11194994114339352,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 0.0008358923605804229,
        "weight_decay": 2.651517665917129e-07,
        "epochs": 112
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.09409541357308626,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.0034535799115139056,
        "weight_decay": 0.005291410588169728,
        "epochs": 587
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.09257386904209852,
        "hidden_dim": 192,
        "num_blocks": 6,
        "lr": 0.001634554647507514,
        "weight_decay": 2.079965023991903e-05,
        "epochs": 235
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.09862146619707346,
        "hidden_dim": 192,
        "num_blocks": 6,
        "lr": 0.00245372336266499,
        "weight_decay": 2.0046510011755427e-05,
        "epochs": 235
      }
    ],
    "vdm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 4.125613123178482,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 2.954347115010023,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 26.00141239911318,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 9.46491388976574,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 19.131649166345596,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 13.54062008857727,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 5.35786822065711,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 1.074147179722786,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.05338054755702615,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 3.924537021666765,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.020461253356188536,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.03220510855317116,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "v_learning": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.11053361091762781,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.07863377220928669,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.07122495118528605,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.11205100081861019,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.11276974342763424,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.09170549549162388,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.11128073465079069,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.07563216704875231,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.0061679796781390905,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.08994595613330603,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.00821213354356587,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.008980735437944531,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "avg_ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.1158975986763835,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.07372377719730139,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.06985842250287533,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.11913580261170864,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.10725513845682144,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.08627868350595236,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 1.4139603404328227,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.08022005390375853,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.007315649883821607,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.08529181405901909,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.01126836333423853,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.027645616326481104,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ]
  },
  "20": {
    "consistency_models": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.20156799256801605,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 480
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 1.1283661015331745,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 480
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 1.5349051430821419,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 480
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.48275820910930634,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 26
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.36011743545532227,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 54
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.5276244431734085,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 406
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.29544167034327984,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 149
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.8476628549396992,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 54
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.3276821728795767,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 753
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.36181487143039703,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 37
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.3533776719123125,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00530555630545886,
        "epochs": 480
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.400649419054389,
        "hidden_dim": 256,
        "num_blocks": 3,
        "lr": 1.1446285549192417e-05,
        "weight_decay": 0.004827332806537314,
        "epochs": 193
      }
    ],
    "ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.08960390463471413,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.05533986445516348,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.05509827844798565,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.11895284336060286,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.08655006065964699,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.07227995432913303,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.10559018701314926,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.06657692603766918,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.009753880323842168,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.08715943433344364,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.014099879190325737,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.016285752644762397,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "ddpm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.09297105763107538,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.06304319109767675,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.04317712690681219,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.10945587325841188,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.08321800362318754,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.07123997993767262,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.106216324493289,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.06203095614910126,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.012835630448535085,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.07385086454451084,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.015892827417701483,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.01811375399120152,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "flow_matching": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.09068375825881958,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.10258762165904045,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 3.0955664602423724e-05,
        "weight_decay": 1.2601639723276798e-07,
        "epochs": 115
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.09138649422675371,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 6.144543785587468e-05,
        "weight_decay": 1.5782327810795563e-06,
        "epochs": 93
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.023145960411056876,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.00043625993625605574,
        "weight_decay": 1.0547383621352015e-07,
        "epochs": 640
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.03512700367718935,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 0.0007026263205443051,
        "weight_decay": 4.374364439939069e-06,
        "epochs": 365
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.09064396005123854,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.06507235020399094,
        "hidden_dim": 256,
        "num_blocks": 6,
        "lr": 0.00041087915453240814,
        "weight_decay": 0.0033981724150106006,
        "epochs": 137
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.08379917498677969,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0017247957710046008,
        "weight_decay": 1.3820379228636985e-06,
        "epochs": 65
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.08217755239456892,
        "hidden_dim": 384,
        "num_blocks": 6,
        "lr": 0.0012141307774357361,
        "weight_decay": 1.5570196345516594e-07,
        "epochs": 61
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.06690802471712232,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 9.278723835524691e-05,
        "weight_decay": 4.9569479327999555e-08,
        "epochs": 640
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.024540970101952553,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.004137629314336305,
        "weight_decay": 1.281655346918598e-08,
        "epochs": 782
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.027389694470912218,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.004471095030947703,
        "weight_decay": 1.1769658897684507e-08,
        "epochs": 782
      }
    ],
    "mean_flow": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.11187245696783066,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 587
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.11195614095777273,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 1.498208643215546e-05,
        "weight_decay": 0.004935296209402108,
        "epochs": 89
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.11684132926166058,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 1.3245461546001868e-05,
        "weight_decay": 8.9532762476427e-07,
        "epochs": 1000
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.12544601783156395,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 6.907675985896193e-05,
        "weight_decay": 8.93511059033186e-07,
        "epochs": 341
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.0944295572116971,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 6.0538336093556843e-05,
        "weight_decay": 9.275294835907672e-08,
        "epochs": 1000
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.11161602102220058,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0002513045354320348,
        "weight_decay": 0.00016523945479957094,
        "epochs": 63
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.08904573135077953,
        "hidden_dim": 192,
        "num_blocks": 5,
        "lr": 0.0005127169631088556,
        "weight_decay": 1.63926099183277e-05,
        "epochs": 276
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.11365439184010029,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.0002688506084952372,
        "weight_decay": 2.8256199318003875e-07,
        "epochs": 728
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.11182096786797047,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 0.0008358923605804229,
        "weight_decay": 2.651517665917129e-07,
        "epochs": 112
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.09556763246655464,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.0034535799115139056,
        "weight_decay": 0.005291410588169728,
        "epochs": 587
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.09200723562389612,
        "hidden_dim": 192,
        "num_blocks": 6,
        "lr": 0.001634554647507514,
        "weight_decay": 2.079965023991903e-05,
        "epochs": 235
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.09643703605979681,
        "hidden_dim": 192,
        "num_blocks": 6,
        "lr": 0.00245372336266499,
        "weight_decay": 2.0046510011755427e-05,
        "epochs": 235
      }
    ],
    "vdm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 4.2856630980968475,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 3.1251215413212776,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 26.843787126243114,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 9.755991991609335,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 19.921319723129272,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 14.08749071136117,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 5.520459499210119,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 1.1696429550647736,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.07603904930874705,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 4.071544528007507,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.029407669324427843,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.04394501447677612,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "v_learning": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.08945941925048828,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.05563263036310673,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.0523623232729733,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.12103030271828175,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.08337801229208708,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.06595344189554453,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.10318034049123526,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.056044723838567734,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.010010236408561468,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.08382637705653906,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.012863703304901719,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.014199166791513562,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "avg_ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.08960390463471413,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.05533986445516348,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.05509827844798565,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.11895284336060286,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.08655006065964699,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.07227995432913303,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.10559018701314926,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.06657692603766918,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.009753880323842168,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.08715943433344364,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.014099879190325737,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.016285752644762397,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ]
  },
  "5": {
    "consistency_models": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.13943834695965052,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 480
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.2450663447380066,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 480
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.2988123260438442,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 480
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.23277440667152405,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 26
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.25823525339365005,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 54
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.20017986744642258,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 406
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.19781934656202793,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 149
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.24449705332517624,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 54
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.13680963590741158,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 753
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.3201041519641876,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 37
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.10738082136958838,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 753
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.10720023419708014,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 753
      }
    ],
    "ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.09896951634436846,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.1080709658563137,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.13854258600622416,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.09527199435979128,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.14439973700791597,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.1285875951871276,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.10660438984632492,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.13302077632397413,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.028615577379241586,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.15344404708594084,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.02212297939695418,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.023337681079283357,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "ddpm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.0951679004356265,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.08559088688343763,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.0976344058290124,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.09685929119586945,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.10883256047964096,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.10370552260428667,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.1068581473082304,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.10045675840228796,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.031017767498269677,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.11161028128117323,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.027522815391421318,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.028062021359801292,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "flow_matching": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.11567062325775623,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.1096054408699274,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 3.0955664602423724e-05,
        "weight_decay": 1.2601639723276798e-07,
        "epochs": 115
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.10756776109337807,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 6.144543785587468e-05,
        "weight_decay": 1.5782327810795563e-06,
        "epochs": 93
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.1128068845719099,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.00043625993625605574,
        "weight_decay": 1.0547383621352015e-07,
        "epochs": 640
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.10947489738464355,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 0.0007026263205443051,
        "weight_decay": 4.374364439939069e-06,
        "epochs": 365
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.11021815985441208,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.11293485760688782,
        "hidden_dim": 256,
        "num_blocks": 6,
        "lr": 0.00041087915453240814,
        "weight_decay": 0.0033981724150106006,
        "epochs": 137
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.11297150887548923,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0017247957710046008,
        "weight_decay": 1.3820379228636985e-06,
        "epochs": 65
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.11153108440339565,
        "hidden_dim": 384,
        "num_blocks": 6,
        "lr": 0.0012141307774357361,
        "weight_decay": 1.5570196345516594e-07,
        "epochs": 61
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.1098967082798481,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 9.278723835524691e-05,
        "weight_decay": 4.9569479327999555e-08,
        "epochs": 640
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.11169881373643875,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00010656465638390326,
        "epochs": 50
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.11168375611305237,
        "hidden_dim": 256,
        "num_blocks": 3,
        "lr": 0.0001601421051424272,
        "weight_decay": 3.483189955222305e-06,
        "epochs": 258
      }
    ],
    "mean_flow": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.11133688129484653,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 587
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.10971485078334808,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 1.498208643215546e-05,
        "weight_decay": 0.004935296209402108,
        "epochs": 89
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.12284458428621292,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 1.3245461546001868e-05,
        "weight_decay": 8.9532762476427e-07,
        "epochs": 1000
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.1369922272861004,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 6.907675985896193e-05,
        "weight_decay": 8.93511059033186e-07,
        "epochs": 341
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.1056978665292263,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 6.0538336093556843e-05,
        "weight_decay": 9.275294835907672e-08,
        "epochs": 1000
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.11181585304439068,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0002513045354320348,
        "weight_decay": 0.00016523945479957094,
        "epochs": 63
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.09615709725767374,
        "hidden_dim": 192,
        "num_blocks": 5,
        "lr": 0.0005127169631088556,
        "weight_decay": 1.63926099183277e-05,
        "epochs": 276
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.11318109184503555,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.0002688506084952372,
        "weight_decay": 2.8256199318003875e-07,
        "epochs": 728
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.11121038161218166,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 0.0008358923605804229,
        "weight_decay": 2.651517665917129e-07,
        "epochs": 112
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.1078969445079565,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.0034535799115139056,
        "weight_decay": 0.005291410588169728,
        "epochs": 587
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.09361565299332142,
        "hidden_dim": 192,
        "num_blocks": 6,
        "lr": 0.001634554647507514,
        "weight_decay": 2.079965023991903e-05,
        "epochs": 235
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.09187271818518639,
        "hidden_dim": 192,
        "num_blocks": 6,
        "lr": 0.00245372336266499,
        "weight_decay": 2.0046510011755427e-05,
        "epochs": 235
      }
    ],
    "vdm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 20.37197158485651,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 27.77771356701851,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 46.1787468418479,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 25.741737958043814,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 38.747454542666674,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 31.238726556301117,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 20.341905873268843,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 42.331921543926,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.24992763251066208,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 29.892797850072384,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.12694184482097626,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.11931566894054413,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "v_learning": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.09904267638921738,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.1050887843593955,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.1296079996973276,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.0929426671937108,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.1361743090674281,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.1227730019018054,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.10673117078840733,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.11940032429993153,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.027332773432135582,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.14896060153841972,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.0222693826071918,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.02261883206665516,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "avg_ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.09896951634436846,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.1080709658563137,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.13854258600622416,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.09527199435979128,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.14439973700791597,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.1285875951871276,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.10660438984632492,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.13302077632397413,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.028615577379241586,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.15344404708594084,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.02212297939695418,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.023337681079283357,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ]
  },
  "1": {
    "consistency_models": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.10954602435231209,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 480
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.10446438658982515,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 480
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.12254956364631653,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 480
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.20415576547384262,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 26
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.34366273134946823,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 54
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.184133879840374,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 406
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.13044572994112968,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 149
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.19930566102266312,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 54
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.08983220718801022,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 753
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.3600158169865608,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 37
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.0923384502530098,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 753
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.09770422335714102,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 753
      }
    ],
    "ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.44192301854491234,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.43512378074228764,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.44019780308008194,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.440662557259202,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.44087390787899494,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.4398017581552267,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.4494254793971777,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.43532997369766235,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.3649081885814667,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.4580583982169628,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.3207593262195587,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.3151329788379371,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "ddpm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.4419232551008463,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.4351240433752537,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.44019813276827335,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.4406622964888811,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.44087414257228374,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.43980174884200096,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.449425445869565,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.4353301580995321,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.36491096671670675,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.45805841870605946,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.3207593928091228,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.3151314703281969,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "flow_matching": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.3109089508652687,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.22531498223543167,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 3.0955664602423724e-05,
        "weight_decay": 1.2601639723276798e-07,
        "epochs": 115
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.2657122202217579,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 6.144543785587468e-05,
        "weight_decay": 1.5782327810795563e-06,
        "epochs": 93
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.45312707871198654,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.00043625993625605574,
        "weight_decay": 1.0547383621352015e-07,
        "epochs": 640
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.5038922429084778,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 0.0007026263205443051,
        "weight_decay": 4.374364439939069e-06,
        "epochs": 365
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.2403903678059578,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.43154118955135345,
        "hidden_dim": 256,
        "num_blocks": 6,
        "lr": 0.00041087915453240814,
        "weight_decay": 0.0033981724150106006,
        "epochs": 137
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.440134409815073,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0017247957710046008,
        "weight_decay": 1.3820379228636985e-06,
        "epochs": 65
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.45095283910632133,
        "hidden_dim": 384,
        "num_blocks": 6,
        "lr": 0.0012141307774357361,
        "weight_decay": 1.5570196345516594e-07,
        "epochs": 61
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.46207449585199356,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 9.278723835524691e-05,
        "weight_decay": 4.9569479327999555e-08,
        "epochs": 640
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.26972758769989014,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 1.0480210082567134e-05,
        "weight_decay": 0.00010656465638390326,
        "epochs": 782
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.2330995872616768,
        "hidden_dim": 384,
        "num_blocks": 4,
        "lr": 4.891411868759297e-05,
        "weight_decay": 6.041230193385872e-05,
        "epochs": 89
      }
    ],
    "mean_flow": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.10743742808699608,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 587
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.19286011159420013,
        "hidden_dim": 512,
        "num_blocks": 2,
        "lr": 1.498208643215546e-05,
        "weight_decay": 0.004935296209402108,
        "epochs": 89
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.2432236671447754,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 1.3245461546001868e-05,
        "weight_decay": 8.9532762476427e-07,
        "epochs": 1000
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.3735128790140152,
        "hidden_dim": 256,
        "num_blocks": 2,
        "lr": 6.907675985896193e-05,
        "weight_decay": 8.93511059033186e-07,
        "epochs": 341
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.38620777428150177,
        "hidden_dim": 128,
        "num_blocks": 2,
        "lr": 6.0538336093556843e-05,
        "weight_decay": 9.275294835907672e-08,
        "epochs": 1000
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.17227144539356232,
        "hidden_dim": 512,
        "num_blocks": 3,
        "lr": 0.0002513045354320348,
        "weight_decay": 0.00016523945479957094,
        "epochs": 63
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.18294299393892288,
        "hidden_dim": 192,
        "num_blocks": 5,
        "lr": 0.0005127169631088556,
        "weight_decay": 1.63926099183277e-05,
        "epochs": 276
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.11493288725614548,
        "hidden_dim": 128,
        "num_blocks": 4,
        "lr": 0.0002688506084952372,
        "weight_decay": 2.8256199318003875e-07,
        "epochs": 728
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.17805831134319305,
        "hidden_dim": 384,
        "num_blocks": 3,
        "lr": 0.0008358923605804229,
        "weight_decay": 2.651517665917129e-07,
        "epochs": 112
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.35366035997867584,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 0.0034535799115139056,
        "weight_decay": 0.005291410588169728,
        "epochs": 587
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.11034274660050869,
        "hidden_dim": 192,
        "num_blocks": 5,
        "lr": 4.851738739952434e-05,
        "weight_decay": 0.00020813665671954047,
        "epochs": 276
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.10952385328710079,
        "hidden_dim": 192,
        "num_blocks": 6,
        "lr": 4.444522404672583e-05,
        "weight_decay": 0.00023279911254747425,
        "epochs": 235
      }
    ],
    "vdm": [
      {
        "trial": 0,
        "status": "success",
        "cd": 70.51894241571426,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 85.80237519741058,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 77.48712182044983,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 64.93227767944336,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 72.90226173400879,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 66.35011267662048,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 66.41730087995529,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 125.16477537155151,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 9.02687469869852,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 87.1576738357544,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.29729005694389343,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.3228079527616501,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "v_learning": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.4419082347303629,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.43512387573719025,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.4401881955564022,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.4406569395214319,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.44087263755500317,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.43980152904987335,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.44942526146769524,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.4353268723934889,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.3637359724380076,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.45805839635431767,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.33504460006952286,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.31045866245403886,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ],
    "avg_ddim": [
      {
        "trial": 0,
        "status": "success",
        "cd": 0.44192301854491234,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 1.4347159517201392e-05,
        "weight_decay": 0.0015741890047456662,
        "epochs": 640
      },
      {
        "trial": 1,
        "status": "success",
        "cd": 0.43512378074228764,
        "hidden_dim": 192,
        "num_blocks": 2,
        "lr": 6.62431060594998e-05,
        "weight_decay": 1.4077923139972383e-05,
        "epochs": 640
      },
      {
        "trial": 2,
        "status": "success",
        "cd": 0.44019780308008194,
        "hidden_dim": 128,
        "num_blocks": 5,
        "lr": 3.458705214751808e-05,
        "weight_decay": 1.217325250419405e-05,
        "epochs": 640
      },
      {
        "trial": 3,
        "status": "success",
        "cd": 0.440662557259202,
        "hidden_dim": 512,
        "num_blocks": 6,
        "lr": 6.639623079859457e-05,
        "weight_decay": 3.855073690026179e-08,
        "epochs": 34
      },
      {
        "trial": 4,
        "status": "success",
        "cd": 0.44087390787899494,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 6.939031266619747e-05,
        "weight_decay": 1.319496149042566e-05,
        "epochs": 72
      },
      {
        "trial": 5,
        "status": "success",
        "cd": 0.4398017581552267,
        "hidden_dim": 128,
        "num_blocks": 6,
        "lr": 1.7331598058558698e-05,
        "weight_decay": 1.499329805509153e-07,
        "epochs": 541
      },
      {
        "trial": 6,
        "status": "success",
        "cd": 0.4494254793971777,
        "hidden_dim": 256,
        "num_blocks": 4,
        "lr": 2.4007683448156354e-05,
        "weight_decay": 0.0006504020246676568,
        "epochs": 199
      },
      {
        "trial": 7,
        "status": "success",
        "cd": 0.43532997369766235,
        "hidden_dim": 384,
        "num_blocks": 5,
        "lr": 0.0012068006375483965,
        "weight_decay": 2.781428564375744e-08,
        "epochs": 72
      },
      {
        "trial": 8,
        "status": "success",
        "cd": 0.3649081885814667,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0009315049998499165,
        "weight_decay": 6.688747907702057e-05,
        "epochs": 1000
      },
      {
        "trial": 9,
        "status": "success",
        "cd": 0.4580583982169628,
        "hidden_dim": 512,
        "num_blocks": 4,
        "lr": 0.0002575373524861559,
        "weight_decay": 3.6749049453053196e-06,
        "epochs": 50
      },
      {
        "trial": 10,
        "status": "success",
        "cd": 0.3207593262195587,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.004137629314336305,
        "weight_decay": 0.00022504121683363166,
        "epochs": 1000
      },
      {
        "trial": 11,
        "status": "success",
        "cd": 0.3151329788379371,
        "hidden_dim": 128,
        "num_blocks": 3,
        "lr": 0.0038034866879872228,
        "weight_decay": 0.00026942213191525466,
        "epochs": 1000
      }
    ]
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = hpoHistoryData;
}
